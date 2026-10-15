import type { Db } from "@/shared/infrastructure/supabase"
import { err, ok, type Result } from "@/shared/domain"
import type { IdeaPatch, IdeasRepository, NewIdea } from "../application/ports"
import { type Brief, type Idea } from "../domain"
import { nextCursor, PAGE_SIZE, type Cursor, type Page } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import { afterCursor } from "./keyset"
import { IDEA_COLUMNS, toIdea, type IdeaRow } from "./idea-row"

export class SupabaseIdeas implements IdeasRepository {
  constructor(private readonly db: Db) {}

  private one(
    query: PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>,
  ) {
    return Promise.resolve(query).then(({ data, error }): Result<Idea> =>
      error ? err(toAppError(error)) : ok(toIdea(data as IdeaRow)),
    )
  }

  async list(spaceId: string, after: Cursor | null): Promise<Result<Page<Idea>>> {
    let query = this.db.from("ideas").select(IDEA_COLUMNS).eq("space_id", spaceId)
    if (after) query = query.or(afterCursor(after))
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE)
    if (error) return err(toAppError(error))
    const items = (data as IdeaRow[]).map(toIdea)
    return ok({ items, next: nextCursor(items) })
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

  async updateBrief(id: string, expectedUpdatedAt: string, brief: Brief): Promise<Result<string>> {
    const { data, error } = await this.db.rpc("update_idea_brief", {
      idea: id,
      expected_updated_at: expectedUpdatedAt,
      brief,
    })
    return error ? err(toAppError(error)) : ok(data as string)
  }

  async remove(id: string): Promise<Result<void>> {
    const { error } = await this.db.from("ideas").delete().eq("id", id)
    return error ? err(toAppError(error)) : ok(undefined)
  }
}
