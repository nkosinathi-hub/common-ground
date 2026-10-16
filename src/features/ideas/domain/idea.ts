import { appError, err, ok, type Result, TITLE_MAX } from "@/shared/domain"
import type { Brief } from "./brief"
import type { Collaborator } from "./collaborators"

export const IDEA_STAGES = [
  "inbox",
  "exploring",
  "planning",
  "building",
  "launched",
  "paused",
  "archived",
] as const
export type IdeaStage = (typeof IDEA_STAGES)[number]

export type IdeaTemplate = "blank" | "business" | "creative"

export interface Idea {
  readonly id: string
  readonly spaceId: string
  readonly title: string
  readonly stage: IdeaStage
  readonly tags: readonly string[]
  readonly template: IdeaTemplate
  readonly brief: Brief
  readonly currency: string
  readonly createdBy: string | null
  /** Invited people, pending and accepted; the author is never among them. */
  readonly collaborators: readonly Collaborator[]
  readonly createdAt: string
  /** Exact server timestamp string; the conflict check compares it verbatim. */
  readonly updatedAt: string
}

/** Stages the Home "Ideas in progress" card lists, and how many it shows. */
export const IN_PROGRESS_STAGES = ["exploring", "planning", "building"] as const
export const IN_PROGRESS_LIMIT = 5

export const TAGS_MAX = 20
/** Longest tag, in characters. */
export const TAG_MAX = 40

export function validateTitle(input: string): Result<string> {
  const title = input.trim()
  if (title.length < 1 || title.length > TITLE_MAX) {
    const message = `Give the idea a title of up to ${TITLE_MAX} characters`
    return err(appError("validation", message, "title"))
  }
  return ok(title)
}

export function normalizeTags(input: readonly string[]): string[] {
  const tags = input.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0)
  return [...new Set(tags)].slice(0, TAGS_MAX)
}

export function validateTags(input: readonly string[]): Result<string[]> {
  const tags = normalizeTags(input)
  return tags.every((tag) => tag.length <= TAG_MAX)
    ? ok(tags)
    : err(appError("validation", `Keep each tag to ${TAG_MAX} characters`, "tags"))
}
