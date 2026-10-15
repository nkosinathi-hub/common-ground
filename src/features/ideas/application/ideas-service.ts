import { appError, type Cursor, err, ok, type Result } from "@/shared/domain"
import {
  cleanBrief,
  normalizeTags,
  templateBrief,
  validateTitle,
  type Brief,
  type Idea,
  type IdeaStage,
  type IdeaTemplate,
} from "../domain"
import type { IdeasRepository } from "./ports"

export type SaveBriefOutcome =
  | { readonly status: "saved"; readonly idea: Idea }
  | { readonly status: "conflict"; readonly latest: Idea }

export interface CaptureInput {
  readonly spaceId: string
  readonly title: string
  readonly template?: IdeaTemplate
}

export class IdeasService {
  constructor(private readonly repo: IdeasRepository) {}

  list = (spaceId: string, after: Cursor | null) => this.repo.list(spaceId, after)
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

  moveStage = (id: string, stage: IdeaStage) => this.repo.update(id, { stage })

  setTags = (id: string, tags: readonly string[]) =>
    this.repo.update(id, { tags: normalizeTags(tags) })

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
