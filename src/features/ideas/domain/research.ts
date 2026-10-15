import { appError, err, ok, type Result } from "@/shared/domain"

export interface IdeaNote {
  readonly id: string
  readonly ideaId: string
  readonly body: string
  readonly createdBy: string | null
  readonly createdAt: string
}

export interface LinkInput {
  readonly url: string
  readonly title: string
  readonly description: string
}

export interface ResearchLink extends LinkInput {
  readonly id: string
  readonly ideaId: string
  readonly createdAt: string
}

export const HYPOTHESIS_STATUSES = ["untested", "validated", "invalidated"] as const
export type HypothesisStatus = (typeof HYPOTHESIS_STATUSES)[number]

export interface Hypothesis {
  readonly id: string
  readonly ideaId: string
  readonly statement: string
  readonly status: HypothesisStatus
  readonly createdAt: string
}

function text(value: string, max: number, field: string, label: string): Result<string> {
  const trimmed = value.trim()
  if (trimmed.length < 1 || trimmed.length > max) {
    return err(appError("validation", `${label} needs 1 to ${max} characters`, field))
  }
  return ok(trimmed)
}

function isWebUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false
  try {
    const url = new URL(value)
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.length > 0
  } catch {
    return false
  }
}

export function validateResearchLink(input: LinkInput): Result<LinkInput> {
  const url = input.url.trim()
  if (url.length > 2048 || !isWebUrl(url)) {
    return err(appError("validation", "Use a web link starting with http:// or https://", "url"))
  }
  const title = text(input.title, 200, "title", "Title")
  if (!title.ok) return title
  const description = input.description.trim()
  if (description.length > 2000)
    return err(appError("validation", "Keep the description short", "description"))
  return ok({ url, title: title.value, description })
}

export const validateNote = (body: string) => text(body, 10000, "body", "A note")
export const validateHypothesis = (statement: string) =>
  text(statement, 1000, "statement", "A hypothesis")
