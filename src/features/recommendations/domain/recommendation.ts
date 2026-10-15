import { appError, err, ok, type Cursor, type MemberRef, type Result } from "@/shared/domain"

export type RecommendationStatus = "pending" | "acknowledged" | "dismissed"
export type RecommendationResponse = Exclude<RecommendationStatus, "pending">

export interface Recommendation extends Cursor {
  readonly spaceId: string
  readonly itemId: string
  readonly itemTitle: string | null
  readonly senderName: string | null
  readonly note: string | null
  readonly status: RecommendationStatus
}

export const MAX_NOTE = 500

export function validateNote(note: string): Result<string | null> {
  const trimmed = note.trim()
  if (trimmed.length > MAX_NOTE)
    return err(appError("validation", `Keep the note under ${MAX_NOTE} characters`, "note"))
  return ok(trimmed === "" ? null : trimmed)
}

export function validateRecipients(ids: readonly string[], me: string): Result<string[]> {
  const unique = [...new Set(ids)].filter((id) => id !== me)
  return unique.length > 0
    ? ok(unique)
    : err(appError("validation", "Choose at least one member", "recipients"))
}

export const recipientOptions = (members: readonly MemberRef[], me: string): MemberRef[] =>
  members
    .filter((m) => m.id !== me)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }))
