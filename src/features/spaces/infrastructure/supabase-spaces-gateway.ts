import { err, ok, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type { Db } from "@/shared/infrastructure/supabase"
import type { SpacesGateway } from "../application/ports"
import { inviteStatus, type InvitePreview, type Member, type Space } from "../domain/space"
import type { SpaceTemplateId } from "../domain/templates"
import { invitesOf } from "./supabase-invites"

type Reply<T> = { data: T | null; error: { code?: string; message?: string } | null }

const unwrap = <T>({ data, error }: Reply<T>): Result<T> =>
  error ? err(toAppError(error)) : ok(data as T)
const unit = ({ error }: Reply<unknown>): Result<void> =>
  error ? err(toAppError(error)) : ok(undefined)

export class SupabaseSpacesGateway implements SpacesGateway {
  constructor(private readonly db: Db) {}

  async listMine(): Promise<Result<Space[]>> {
    const { data: auth } = await this.db.auth.getUser()
    const reply = await this.db
      .from("space_members")
      .select("role, spaces!inner(id, name, template)")
      .eq("user_id", auth.user?.id ?? "")
      .order("joined_at")
    const rows = unwrap(reply)
    if (!rows.ok) return rows
    return ok(
      (rows.value ?? []).map((r) => ({
        id: r.spaces.id,
        name: r.spaces.name,
        template: r.spaces.template,
        role: r.role,
      })),
    )
  }

  create = async (name: string, template: SpaceTemplateId) =>
    unwrap<string>(
      await this.db.rpc("create_space", { space_name: name, space_template: template }),
    )

  rename = async (spaceId: string, name: string, template: SpaceTemplateId) =>
    unit(await this.db.from("spaces").update({ name, template }).eq("id", spaceId))

  async members(spaceId: string): Promise<Result<Member[]>> {
    const reply = await this.db
      .from("space_members")
      .select("user_id, role, joined_at, profiles!inner(display_name)")
      .eq("space_id", spaceId)
      .order("joined_at")
    const rows = unwrap(reply)
    if (!rows.ok) return rows
    return ok(
      (rows.value ?? []).map((r) => ({
        userId: r.user_id,
        role: r.role,
        joinedAt: r.joined_at,
        displayName: r.profiles.display_name,
      })),
    )
  }

  leave = async (spaceId: string) =>
    unit(await this.db.rpc("leave_space", { target_space: spaceId }))
  removeMember = async (spaceId: string, userId: string) =>
    unit(await this.db.rpc("remove_member", { target_space: spaceId, member: userId }))
  transferOwnership = async (spaceId: string, userId: string) =>
    unit(await this.db.rpc("transfer_ownership", { target_space: spaceId, new_owner: userId }))
  delete = async (spaceId: string, confirmName: string) =>
    unit(await this.db.rpc("delete_space", { target_space: spaceId, confirm_name: confirmName }))

  invites = (spaceId: string) => invitesOf(this.db, spaceId, (row) => inviteStatus(row, new Date()))
  createInvite = async (spaceId: string) =>
    unwrap<string>(await this.db.rpc("create_invite", { target_space: spaceId }))
  revokeInvite = async (inviteId: string) =>
    unit(await this.db.rpc("revoke_invite", { invite: inviteId }))
  redeemInvite = async (token: string) =>
    unwrap<string>(await this.db.rpc("redeem_invite", { token }))

  async previewInvite(token: string): Promise<Result<InvitePreview>> {
    const rows = unwrap(await this.db.rpc("invite_preview", { token }))
    if (!rows.ok) return rows
    const row = rows.value?.[0]
    return ok({
      spaceName: row?.space_name ?? null,
      inviterName: row?.inviter_name ?? null,
      status: (row?.status ?? "invalid") as InvitePreview["status"],
    })
  }
}
