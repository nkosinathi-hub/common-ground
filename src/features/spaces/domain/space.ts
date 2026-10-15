import { appError, err, ok, type Result } from "@/shared/domain"
import type { SpaceTemplateId } from "./templates"

export type SpaceRole = "owner" | "member"

export interface Space {
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

export interface Invite {
  readonly id: string
  readonly createdAt: string
  readonly expiresAt: string
  readonly status: InviteStatus
}

export interface InvitePreview {
  readonly spaceName: string | null
  readonly inviterName: string | null
  readonly status: "valid" | "invalid" | "used" | "revoked" | "expired" | "member"
}

export function validateSpaceName(name: string): Result<string> {
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= 80
    ? ok(trimmed)
    : err(appError("validation", "Name your space (up to 80 characters)", "name"))
}

export function inviteStatus(
  row: { redeemedAt: string | null; revokedAt: string | null; expiresAt: string },
  now: Date,
): InviteStatus {
  if (row.revokedAt) return "revoked"
  if (row.redeemedAt) return "used"
  return new Date(row.expiresAt) <= now ? "expired" : "open"
}

export const inviteLink = (appUrl: string, token: string) => `${appUrl}#/invite/${token}`

/** Picks the remembered space if the user still belongs to it, else the first one. */
export function chooseActiveSpace(spaces: readonly Space[], remembered: string | null): Space | null {
  return spaces.find((s) => s.id === remembered) ?? spaces[0] ?? null
}
