import { formatDay } from "@/shared/domain"
import type { Invite } from "../../domain/space"

const DAY = 86_400_000

/** "27 Oct · Expires in 7 days · Not used yet": an open link's line under its creator. */
export function inviteLine(invite: Invite, now: number): string {
  const days = Math.max(1, Math.ceil((Date.parse(invite.expiresAt) - now) / DAY))
  return `${formatDay(invite.createdAt)} · Expires in ${days} day${days === 1 ? "" : "s"} · Not used yet`
}

/** The owner revokes any link; a member only their own. */
export const canRevoke = (invite: Invite, me: string, owner: boolean) =>
  owner || invite.createdBy === me
