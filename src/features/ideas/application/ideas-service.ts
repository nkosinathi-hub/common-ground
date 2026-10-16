import {
  appError,
  asAuthors,
  type AuthorDirectory,
  type Cursor,
  err,
  type MemberDirectory,
  ok,
  type Result,
} from "@/shared/domain"
import {
  cleanBrief,
  templateBrief,
  validateTags,
  validateTitle,
  type Brief,
  type Idea,
  type IdeaStage,
} from "../domain"
import type {
  CaptureInput,
  CollaboratorsRepository,
  IdeaScope,
  IdeasRepository,
  SaveBriefOutcome,
} from "./ports"

export type { CaptureInput, SaveBriefOutcome } from "./ports"

export class IdeasService {
  constructor(
    private readonly repo: IdeasRepository,
    private readonly people: CollaboratorsRepository,
    private readonly directory: MemberDirectory,
    private readonly names: AuthorDirectory = asAuthors(directory),
  ) {}

  list = (spaceId: string, after: Cursor | null, scope?: IdeaScope) =>
    this.repo.list(spaceId, after, scope)
  get = (id: string) => this.repo.get(id)
  /** Only the author or the space owner may delete; the server refuses anyone else. */
  remove = (id: string) => this.repo.remove(id)

  async capture(input: CaptureInput): Promise<Result<Idea>> {
    const title = validateTitle(input.title)
    if (!title.ok) return title
    const template = input.template ?? "blank"
    return this.repo.create({
      spaceId: input.spaceId,
      title: title.value,
      template,
      brief: templateBrief(template),
    })
  }

  async rename(id: string, input: string): Promise<Result<Idea>> {
    const title = validateTitle(input)
    return title.ok ? this.repo.update(id, { title: title.value }) : title
  }

  /** Current members, for pickers. */
  members = (spaceId: string) => this.directory.members(spaceId)
  /** Names for authors and people, including removed members still visible to the viewer. */
  authors = (spaceId: string) => this.names.authors(spaceId)
  collaborators = (ideaId: string) => this.people.list(ideaId)
  respond = (ideaId: string, accept: boolean) => this.people.respond(ideaId, accept)
  removeCollaborator = (ideaId: string, userId: string) => this.people.remove(ideaId, userId)

  /** Invites each member in turn; a refusal does not stop the rest. Reports the first one. */
  async invite(ideaId: string, userIds: readonly string[]): Promise<Result<void>> {
    let first: Result<void> = ok(undefined)
    for (const userId of userIds) {
      const sent = await this.people.invite(ideaId, userId)
      if (!sent.ok && first.ok) first = sent
    }
    return first
  }

  moveStage = (id: string, stage: IdeaStage) => this.repo.update(id, { stage })

  async setTags(id: string, input: readonly string[]): Promise<Result<Idea>> {
    const tags = validateTags(input)
    return tags.ok ? this.repo.update(id, { tags: tags.value }) : tags
  }

  /** Never overwrites silently: a stale base returns the latest copy for the merge prompt. */
  async saveBrief(base: Idea, draft: Brief): Promise<Result<SaveBriefOutcome>> {
    const brief = cleanBrief(draft)
    if (!brief.ok) return brief
    const saved = await this.repo.updateBrief(base.id, base.updatedAt, brief.value)
    if (saved.ok) {
      const idea = { ...base, brief: brief.value, updatedAt: saved.value }
      return ok({ status: "saved", idea })
    }
    if (saved.error.kind !== "conflict") return saved
    const latest = await this.repo.get(base.id)
    if (!latest.ok) return err(appError("conflict", saved.error.message))
    return ok({ status: "conflict", latest: latest.value })
  }
}
