import type { Cursor, Page, Result } from "@/shared/domain"
import { removed, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { ChildCollection, ResearchRepository } from "../application/ports"
import type { Hypothesis, HypothesisStatus, IdeaNote, LinkInput, ResearchLink } from "../domain"
import { newestFirst } from "./newest-first"
import * as rows from "./research-rows"

class SupabaseNotes implements ChildCollection<IdeaNote, string> {
  constructor(private readonly db: Db) {}

  private get table() {
    return this.db.from("idea_notes")
  }

  list(ideaId: string, after: Cursor | null): Promise<Result<Page<IdeaNote>>> {
    const query = this.table.select(rows.NOTE_COLUMNS).eq("idea_id", ideaId)
    return settle(newestFirst(query, after), rows.pageOf(rows.toNote))
  }

  add(spaceId: string, ideaId: string, body: string): Promise<Result<IdeaNote>> {
    const row = { space_id: spaceId, idea_id: ideaId, body }
    return settle(this.table.insert(row).select(rows.NOTE_COLUMNS).single(), rows.toNote)
  }

  remove = (id: string) => removed(this.table.delete().eq("id", id).select("id"))
}

class SupabaseLinks implements ChildCollection<ResearchLink, LinkInput> {
  constructor(private readonly db: Db) {}

  private get table() {
    return this.db.from("research_links")
  }

  list(ideaId: string, after: Cursor | null): Promise<Result<Page<ResearchLink>>> {
    const query = this.table.select(rows.LINK_COLUMNS).eq("idea_id", ideaId)
    return settle(newestFirst(query, after), rows.pageOf(rows.toLink))
  }

  add(spaceId: string, ideaId: string, input: LinkInput): Promise<Result<ResearchLink>> {
    const row = { space_id: spaceId, idea_id: ideaId, ...input }
    return settle(this.table.insert(row).select(rows.LINK_COLUMNS).single(), rows.toLink)
  }

  remove = (id: string) => removed(this.table.delete().eq("id", id).select("id"))
}

class SupabaseHypotheses implements ChildCollection<Hypothesis, string> {
  constructor(private readonly db: Db) {}

  private get table() {
    return this.db.from("hypotheses")
  }

  list(ideaId: string, after: Cursor | null): Promise<Result<Page<Hypothesis>>> {
    const query = this.table.select(rows.HYPOTHESIS_COLUMNS).eq("idea_id", ideaId)
    return settle(newestFirst(query, after), rows.pageOf(rows.toHypothesis))
  }

  add(spaceId: string, ideaId: string, statement: string): Promise<Result<Hypothesis>> {
    const row = { space_id: spaceId, idea_id: ideaId, statement }
    return settle(
      this.table.insert(row).select(rows.HYPOTHESIS_COLUMNS).single(),
      rows.toHypothesis,
    )
  }

  /** Status is the only column the app updates (and the only one granted). */
  setStatus(id: string, status: HypothesisStatus): Promise<Result<Hypothesis>> {
    const query = this.table.update({ status }).eq("id", id)
    return settle(query.select(rows.HYPOTHESIS_COLUMNS).single(), rows.toHypothesis)
  }

  remove = (id: string) => removed(this.table.delete().eq("id", id).select("id"))
}

export class SupabaseResearch implements ResearchRepository {
  readonly notes: SupabaseNotes
  readonly links: SupabaseLinks
  readonly hypotheses: SupabaseHypotheses

  constructor(db: Db) {
    this.notes = new SupabaseNotes(db)
    this.links = new SupabaseLinks(db)
    this.hypotheses = new SupabaseHypotheses(db)
  }
}
