import { appError, err, ok, type Result } from "@/shared/domain"
import type { SpaceProfile } from "./look"
import type { SpaceTemplateId } from "./templates"

export type SpaceRole = "owner" | "member"

/** A space the user belongs to, with everything the owner has customised. */
export interface Space extends SpaceProfile {
  readonly id: string
  readonly name: string
  readonly template: SpaceTemplateId
  readonly role: SpaceRole
}

export interface Member {
  readonly userId: string
  readonly displayName: string
  readonly role: SpaceRole
  readonly joinedAt: string
}

export type InviteStatus = "open" | "used" | "revoked" | "expired"

/** An invite as stored: its status depends on the time it is looked at. */
export interface InviteRecord {
  readonly id: string
  readonly createdAt: string
  readonly expiresAt: string
  readonly redeemedAt: string | null
  readonly revokedAt: string | null
  /** Who made the link; null once they deleted their account. */
  readonly createdBy: string | null
}

export interface Invite {
  readonly id: string
  readonly createdAt: string
  readonly expiresAt: string
  readonly status: InviteStatus
  readonly createdBy: string | null
}

const PREVIEW_STATUSES = ["valid", "invalid", "used", "revoked", "expired", "member"] as const
export type InvitePreviewStatus = (typeof PREVIEW_STATUSES)[number]

export interface InvitePreview {
  readonly spaceName: string | null
  readonly inviterName: string | null
  readonly status: InvitePreviewStatus
}

const SPACE_NAME_MAX = 80

export function validateSpaceName(name: string): Result<string> {
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= SPACE_NAME_MAX
    ? ok(trimmed)
    : err(appError("validation", `Name your space (up to ${SPACE_NAME_MAX} characters)`, "name"))
}

export function inviteStatus(record: InviteRecord, now: Date): InviteStatus {
  if (record.revokedAt) return "revoked"
  if (record.redeemedAt) return "used"
  return new Date(record.expiresAt) <= now ? "expired" : "open"
}

/** The invite as a member sees it at `now`. */
export const inviteAt = (record: InviteRecord, now: Date): Invite => ({
  id: record.id,
  createdAt: record.createdAt,
  expiresAt: record.expiresAt,
  status: inviteStatus(record, now),
  createdBy: record.createdBy,
})

/** Anything the preview RPC answers that this client does not know reads as invalid. */
export function previewStatus(raw: string | undefined): InvitePreviewStatus {
  return PREVIEW_STATUSES.find((status) => status === raw) ?? "invalid"
}

export const inviteLink = (appUrl: string, token: string) => `${appUrl}#/invite/${token}`

/** Picks the remembered space if the user still belongs to it, else the first one. */
export function chooseActiveSpace(
  spaces: readonly Space[],
  remembered: string | null,
): Space | null {
  return spaces.find((s) => s.id === remembered) ?? spaces[0] ?? null
}
