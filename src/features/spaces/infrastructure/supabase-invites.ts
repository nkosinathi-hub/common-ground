import { err, ok, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type { Db } from "@/shared/infrastructure/supabase"
import type { Invite, InviteStatus } from "../domain/space"

type Row = { redeemedAt: string | null; revokedAt: string | null; expiresAt: string }

export async function invitesOf(
  db: Db,
  spaceId: string,
  statusOf: (row: Row) => InviteStatus,
): Promise<Result<Invite[]>> {
  const { data, error } = await db
    .from("space_invites")
    .select("id, created_at, expires_at, redeemed_at, revoked_at")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) return err(toAppError(error))
  return ok(
    (data ?? []).map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      status: statusOf({
        redeemedAt: r.redeemed_at,
        revokedAt: r.revoked_at,
        expiresAt: r.expires_at,
      }),
    })),
  )
}
