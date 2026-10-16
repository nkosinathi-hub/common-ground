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
  readonly createdBy: string | null
  readonly createdAt: string
}

export const HYPOTHESIS_STATUSES = ["untested", "validated", "invalidated"] as const
export type HypothesisStatus = (typeof HYPOTHESIS_STATUSES)[number]

export interface Hypothesis {
  readonly id: string
  readonly ideaId: string
  readonly statement: string
  readonly status: HypothesisStatus
  readonly createdBy: string | null
  readonly createdAt: string
}

/** A required, trimmed text field: its limit, the form field it belongs to and its name. */
interface TextRule {
  readonly max: number
  readonly field: string
  readonly label: string
}

export const URL_MAX = 2048
export const LINK_TITLE_MAX = 200
export const LINK_DESCRIPTION_MAX = 2000
export const NOTE_MAX = 10000
export const HYPOTHESIS_MAX = 1000

function text(value: string, { max, field, label }: TextRule): Result<string> {
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
  if (url.length > URL_MAX || !isWebUrl(url)) {
    return err(appError("validation", "Use a web link starting with http:// or https://", "url"))
  }
  const title = text(input.title, { max: LINK_TITLE_MAX, field: "title", label: "Title" })
  if (!title.ok) return title
  const description = input.description.trim()
  if (description.length > LINK_DESCRIPTION_MAX)
    return err(appError("validation", "Keep the description short", "description"))
  return ok({ url, title: title.value, description })
}

export const validateNote = (body: string) =>
  text(body, { max: NOTE_MAX, field: "body", label: "A note" })
export const validateHypothesis = (statement: string) =>
  text(statement, { max: HYPOTHESIS_MAX, field: "statement", label: "A hypothesis" })
