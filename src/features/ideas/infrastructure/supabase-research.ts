import type { Db } from "@/shared/infrastructure/supabase"
import type { ResearchRepository } from "../application/ports"
import type { Hypothesis, HypothesisStatus, IdeaNote, LinkInput, ResearchLink } from "../domain"
import { single, SupabaseChildren } from "./supabase-children"

const s = (value: unknown) => value as string

const notes = {
  table: "idea_notes",
  columns: "id, idea_id, body, created_by, created_at",
  toModel: (r: Record<string, unknown>): IdeaNote => ({
    id: s(r.id),
    ideaId: s(r.idea_id),
    body: s(r.body),
    createdBy: r.created_by as string | null,
    createdAt: s(r.created_at),
  }),
  toRow: (body: string) => ({ body }),
}

const links = {
  table: "research_links",
  columns: "id, idea_id, url, title, description, created_at",
  toModel: (r: Record<string, unknown>): ResearchLink => ({
    id: s(r.id),
    ideaId: s(r.idea_id),
    url: s(r.url),
    title: s(r.title),
    description: s(r.description),
    createdAt: s(r.created_at),
  }),
  toRow: (input: LinkInput) => ({ ...input }),
}

const hypotheses = {
  table: "hypotheses",
  columns: "id, idea_id, statement, status, created_at",
  toModel: (r: Record<string, unknown>): Hypothesis => ({
    id: s(r.id),
    ideaId: s(r.idea_id),
    statement: s(r.statement),
    status: r.status as HypothesisStatus,
    createdAt: s(r.created_at),
  }),
  toRow: (statement: string) => ({ statement }),
}

class SupabaseHypotheses extends SupabaseChildren<Hypothesis, string> {
  setStatus(id: string, status: HypothesisStatus) {
    const query = this.from()
      .update({ status } as never)
      .eq("id", id)
      .select(this.spec.columns)
      .single()
    return single(query, this.spec.toModel)
  }
}

export function supabaseResearch(db: Db): ResearchRepository {
  return {
    notes: new SupabaseChildren(db, notes),
    links: new SupabaseChildren(db, links),
    hypotheses: new SupabaseHypotheses(db, hypotheses),
  }
}
