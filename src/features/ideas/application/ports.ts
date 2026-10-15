import type { Cursor, Page, Result } from "@/shared/domain"
import type {
  Brief,
  Hypothesis,
  HypothesisStatus,
  Idea,
  IdeaNote,
  IdeaStage,
  IdeaTemplate,
  LinkInput,
  ResearchLink,
} from "../domain"

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

/** A list of records hanging off one idea (notes, links, hypotheses). */
export interface ChildCollection<T, Input> {
  list(ideaId: string, after: Cursor | null): Promise<Result<Page<T>>>
  add(spaceId: string, ideaId: string, input: Input): Promise<Result<T>>
  remove(id: string): Promise<Result<void>>
}

export interface ResearchRepository {
  readonly notes: ChildCollection<IdeaNote, string>
  readonly links: ChildCollection<ResearchLink, LinkInput>
  readonly hypotheses: ChildCollection<Hypothesis, string> & {
    setStatus(id: string, status: HypothesisStatus): Promise<Result<Hypothesis>>
  }
}
