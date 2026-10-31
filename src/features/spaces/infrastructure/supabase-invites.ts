import type { Result } from "@/shared/domain"
import { settle } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import { previewStatus, type InvitePreview, type InviteRecord } from "../domain/space"

/** The owner's settings page lists only the latest invites. */
const RECENT_INVITES = 50

export function invitesOf(db: Db, spaceId: string): Promise<Result<InviteRecord[]>> {
  const query = db
    .from("space_invites")
    .select("id, created_at, expires_at, redeemed_at, revoked_at, created_by")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false })
    .limit(RECENT_INVITES)
  return settle(query, (rows) =>
    rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      redeemedAt: row.redeemed_at,
      revokedAt: row.revoked_at,
      createdBy: row.created_by,
    })),
  )
}

export function previewOf(db: Db, token: string): Promise<Result<InvitePreview>> {
  return settle(db.rpc("invite_preview", { token }), (rows) => {
    const row = rows[0]
    return {
      spaceName: row?.space_name ?? null,
      inviterName: row?.inviter_name ?? null,
      status: previewStatus(row?.status),
    }
  })
}
