import { nextCursor, PAGE_SIZE, type Cursor, type Page, type Result } from "@/shared/domain"
import { olderThan } from "@/shared/infrastructure/paging"
import { removed, settle, type QueryReply } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { IdeaPatch, IdeasRepository, NewIdea } from "../application/ports"
import type { Brief, Idea } from "../domain"
import { IDEA_COLUMNS, toIdea, type IdeaRow } from "./idea-row"

const toPage = (data: unknown): Page<Idea> => {
  const items = (data as IdeaRow[]).map(toIdea)
  return { items, next: nextCursor(items) }
}

export class SupabaseIdeas implements IdeasRepository {
  constructor(private readonly db: Db) {}

  private one(query: PromiseLike<QueryReply>): Promise<Result<Idea>> {
    return settle(query, (data) => toIdea(data as IdeaRow))
  }

  list(spaceId: string, after: Cursor | null): Promise<Result<Page<Idea>>> {
    let query = this.db.from("ideas").select(IDEA_COLUMNS).eq("space_id", spaceId)
    if (after) query = query.or(olderThan(after))
    const page = query.order("created_at", { ascending: false }).order("id", { ascending: false })
    return settle(page.limit(PAGE_SIZE), toPage)
  }

  get(id: string) {
    return this.one(this.db.from("ideas").select(IDEA_COLUMNS).eq("id", id).single())
  }

  create(input: NewIdea) {
    const row = {
      space_id: input.spaceId,
      title: input.title,
      template: input.template,
      brief: input.brief,
    }
    return this.one(this.db.from("ideas").insert(row).select(IDEA_COLUMNS).single())
  }

  update(id: string, patch: IdeaPatch) {
    const row = { ...patch, tags: patch.tags ? [...patch.tags] : undefined }
    return this.one(this.db.from("ideas").update(row).eq("id", id).select(IDEA_COLUMNS).single())
  }

  updateBrief(id: string, expectedUpdatedAt: string, brief: Brief): Promise<Result<string>> {
    const call = this.db.rpc("update_idea_brief", {
      idea: id,
      expected_updated_at: expectedUpdatedAt,
      brief,
    })
    return settle(call, (data) => data as string)
  }

  remove(id: string): Promise<Result<void>> {
    return removed(this.db.from("ideas").delete().eq("id", id).select("id"))
  }
}
