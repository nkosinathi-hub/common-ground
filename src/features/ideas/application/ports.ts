import type { Cursor, Page, Result } from "@/shared/domain"
import type {
  Brief,
  Collaborator,
  Hypothesis,
  HypothesisStatus,
  Idea,
  IdeaNote,
  IdeaStage,
  IdeaTemplate,
  LinkInput,
  ResearchLink,
  Whose,
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

/** A server-side narrowing of the list: the viewer's own ideas, or every idea they are on. */
export interface IdeaScope {
  readonly whose: Whose
  readonly me: string
}

export interface IdeasRepository {
  list(spaceId: string, after: Cursor | null, scope?: IdeaScope): Promise<Result<Page<Idea>>>
  get(id: string): Promise<Result<Idea>>
  /** Ideas in the in-progress stages, most recently changed first. */
  inProgress(spaceId: string, limit: number): Promise<Result<Idea[]>>
  create(input: NewIdea): Promise<Result<Idea>>
  update(id: string, patch: IdeaPatch): Promise<Result<Idea>>
  /** Fails with kind "conflict" when expectedUpdatedAt is stale. Returns the new updatedAt. */
  updateBrief(id: string, expectedUpdatedAt: string, brief: Brief): Promise<Result<string>>
  remove(id: string): Promise<Result<void>>
}

/** Invites onto an idea. The server checks who may invite, answer and remove. */
export interface CollaboratorsRepository {
  list(ideaId: string): Promise<Result<Collaborator[]>>
  invite(ideaId: string, userId: string): Promise<Result<void>>
  respond(ideaId: string, accept: boolean): Promise<Result<void>>
  remove(ideaId: string, userId: string): Promise<Result<void>>
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

export type SaveBriefOutcome =
  | { readonly status: "saved"; readonly idea: Idea }
  | { readonly status: "conflict"; readonly latest: Idea }

export interface CaptureInput {
  readonly spaceId: string
  readonly title: string
  readonly template?: IdeaTemplate
}
