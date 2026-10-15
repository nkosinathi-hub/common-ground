import type { Cursor, Page, Result } from "@/shared/domain"
import type { Brief, Idea, IdeaStage, IdeaTemplate } from "../domain"

export interface NewIdea {
  readonly spaceId: string
  readonly title: string
  readonly template: IdeaTemplate
  readonly brief: Brief
}

export interface IdeaPatch {
  readonly title?: string
  readonly stage?: IdeaStage
  readonly tags?: readonly string[]
}

export interface IdeasRepository {
  list(spaceId: string, after: Cursor | null): Promise<Result<Page<Idea>>>
  get(id: string): Promise<Result<Idea>>
  create(input: NewIdea): Promise<Result<Idea>>
  update(id: string, patch: IdeaPatch): Promise<Result<Idea>>
  /** Fails with kind "conflict" when expectedUpdatedAt is stale. Returns the new updatedAt. */
  updateBrief(id: string, expectedUpdatedAt: string, brief: Brief): Promise<Result<string>>
  remove(id: string): Promise<Result<void>>
}
