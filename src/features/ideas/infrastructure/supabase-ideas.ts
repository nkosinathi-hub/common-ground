import type { Cursor, Page, Result } from "@/shared/domain"
import { newestFirst, pageOf } from "@/shared/infrastructure/paging"
import { removed, settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { IdeaPatch, IdeaScope, IdeasRepository, NewIdea } from "../application/ports"
import type { Brief, Idea } from "../domain"
import { IDEA_COLUMNS, toIdea } from "./idea-row"

export class SupabaseIdeas implements IdeasRepository {
  constructor(private readonly db: Db) {}

  private get ideas() {
    return this.db.from("ideas")
  }

  list(spaceId: string, after: Cursor | null, scope?: IdeaScope): Promise<Result<Page<Idea>>> {
    let query = this.ideas.select(IDEA_COLUMNS).eq("space_id", spaceId)
    if (scope?.whose === "mine") query = query.eq("created_by", scope.me)
    // `ours` is a computed field: the caller started the idea or accepted an invite to it.
    if (scope?.whose === "ours") query = query.is("ours", true)
    return settle(newestFirst(query, after), pageOf(toIdea))
  }

  get(id: string): Promise<Result<Idea>> {
    return settle(this.ideas.select(IDEA_COLUMNS).eq("id", id).single(), toIdea)
  }

  create(input: NewIdea): Promise<Result<Idea>> {
    const { spaceId, title, template, brief } = input
    const row = { space_id: spaceId, title, template, brief }
    return settle(this.ideas.insert(row).select(IDEA_COLUMNS).single(), toIdea)
  }

  update(id: string, patch: IdeaPatch): Promise<Result<Idea>> {
    const row = { ...patch, tags: patch.tags ? [...patch.tags] : undefined }
    return settle(this.ideas.update(row).eq("id", id).select(IDEA_COLUMNS).single(), toIdea)
  }

  updateBrief(id: string, expectedUpdatedAt: string, brief: Brief): Promise<Result<string>> {
    const args = { idea: id, expected_updated_at: expectedUpdatedAt, brief }
    return settle(this.db.rpc("update_idea_brief", args), (updatedAt) => updatedAt)
  }

  remove(id: string): Promise<Result<void>> {
    return removed(this.ideas.delete().eq("id", id).select("id"))
  }
}
