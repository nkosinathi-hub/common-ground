import {
  appError,
  type Cursor,
  err,
  nextCursor,
  ok,
  type Page,
  PAGE_SIZE,
  type Result,
} from "@/shared/domain"
import type { IdeaPatch, IdeaScope, IdeasRepository, NewIdea } from "../application/ports"
import { filterIdeas, type Brief, type Idea } from "../domain"

const stamp = (n: number) => new Date(Date.UTC(2026, 9, 15, 0, 0, n)).toISOString()

/** Behaves like the database: newest first, keyset pages, updated_at conflict check. */
export class InMemoryIdeas implements IdeasRepository {
  readonly rows = new Map<string, Idea>()
  /** Who the next ideas are started by. */
  author: string | null = null
  private clock = 0

  private tick(): string {
    this.clock += 1
    return stamp(this.clock)
  }

  async list(
    spaceId: string,
    after: Cursor | null,
    scope?: IdeaScope,
  ): Promise<Result<Page<Idea>>> {
    const inSpace = [...this.rows.values()].filter((idea) => idea.spaceId === spaceId)
    const sorted = filterIdeas(inSpace, { whose: scope?.whose }, scope?.me).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    )
    const start = after ? sorted.findIndex((idea) => idea.id === after.id) + 1 : 0
    const items = sorted.slice(start, start + PAGE_SIZE)
    return ok({ items, next: nextCursor(items) })
  }

  async get(id: string): Promise<Result<Idea>> {
    const idea = this.rows.get(id)
    return idea ? ok(idea) : err(appError("not_found", "Idea not found"))
  }

  async create(input: NewIdea): Promise<Result<Idea>> {
    const now = this.tick()
    const idea: Idea = {
      ...input,
      id: `idea-${this.rows.size + 1}`,
      stage: "inbox",
      tags: [],
      currency: "ZAR",
      createdBy: this.author,
      collaborators: [],
      createdAt: now,
      updatedAt: now,
    }
    this.rows.set(idea.id, idea)
    return ok(idea)
  }

  async update(id: string, patch: IdeaPatch): Promise<Result<Idea>> {
    const found = await this.get(id)
    if (!found.ok) return found
    const idea = { ...found.value, ...patch, updatedAt: this.tick() } as Idea
    this.rows.set(id, idea)
    return ok(idea)
  }

  async updateBrief(id: string, expectedUpdatedAt: string, brief: Brief): Promise<Result<string>> {
    const found = await this.get(id)
    if (!found.ok) return found
    if (found.value.updatedAt !== expectedUpdatedAt)
      return err(appError("conflict", "Changed elsewhere"))
    const updatedAt = this.tick()
    this.rows.set(id, { ...found.value, brief, updatedAt })
    return ok(updatedAt)
  }

  async remove(id: string): Promise<Result<void>> {
    return this.rows.delete(id) ? ok(undefined) : err(appError("not_found", "Idea not found"))
  }
}
