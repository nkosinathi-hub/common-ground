import { appError, err, ok, type Result } from "@/shared/domain"
import type { Brief } from "./brief"

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

export const IDEA_TEMPLATES = ["blank", "business", "creative"] as const
export type IdeaTemplate = (typeof IDEA_TEMPLATES)[number]

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
  readonly createdAt: string
  /** Exact server timestamp string; the conflict check compares it verbatim. */
  readonly updatedAt: string
}

export function validateTitle(input: string): Result<string> {
  const title = input.trim()
  if (title.length < 1 || title.length > 200) {
    return err(appError("validation", "Give the idea a title of up to 200 characters", "title"))
  }
  return ok(title)
}

export function normalizeTags(input: readonly string[]): string[] {
  const tags = input.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0)
  return [...new Set(tags)].slice(0, 20)
}
