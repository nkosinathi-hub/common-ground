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

export function makeIdeasUseCases(repo: IdeasRepository) {
  return {
    list: (spaceId: string, after: Cursor | null) => repo.list(spaceId, after),
    get: (id: string) => repo.get(id),
    remove: (id: string) => repo.remove(id),

    async capture(input: CaptureInput): Promise<Result<Idea>> {
      const title = validateTitle(input.title)
      if (!title.ok) return title
      const template = input.template ?? "blank"
      return repo.create({
        spaceId: input.spaceId,
        title: title.value,
        template,
        brief: templateBrief(template),
      })
    },

    async rename(id: string, input: string): Promise<Result<Idea>> {
      const title = validateTitle(input)
      return title.ok ? repo.update(id, { title: title.value }) : title
    },

    moveStage: (id: string, stage: IdeaStage) => repo.update(id, { stage }),
    setTags: (id: string, tags: readonly string[]) =>
      repo.update(id, { tags: normalizeTags(tags) }),

    /** Never overwrites silently: a stale base returns the latest copy for the merge prompt. */
    async saveBrief(base: Idea, draft: Brief): Promise<Result<SaveBriefOutcome>> {
      const brief = cleanBrief(draft)
      if (!brief.ok) return brief
      const saved = await repo.updateBrief(base.id, base.updatedAt, brief.value)
      if (saved.ok)
        return ok({
          status: "saved",
          idea: { ...base, brief: brief.value, updatedAt: saved.value },
        })
      if (saved.error.kind !== "conflict") return saved
      const latest = await repo.get(base.id)
      if (!latest.ok) return err(appError("conflict", saved.error.message))
      return ok({ status: "conflict", latest: latest.value })
    },
  }
}

export type IdeasUseCases = ReturnType<typeof makeIdeasUseCases>
