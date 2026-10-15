import type { Result } from "@/shared/domain"
import { done, settle, signedOut } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { SpacesGateway } from "../application/ports"
import type { Member, Space } from "../domain/space"
import type { SpaceTemplateId } from "../domain/templates"
import { invitesOf, previewOf } from "./supabase-invites"

/** The create and redeem RPCs already return the id or token the port promises. */
const unchanged = <T>(value: T) => value

export class SupabaseSpacesGateway implements SpacesGateway {
  constructor(private readonly db: Db) {}

  async listMine(): Promise<Result<Space[]>> {
    const { data } = await this.db.auth.getUser()
    if (!data.user) return signedOut()
    const query = this.db
      .from("space_members")
      .select("role, spaces!inner(id, name, template)")
      .eq("user_id", data.user.id)
      .order("joined_at")
    return settle(query, (rows) =>
      rows.map((row) => ({
        id: row.spaces.id,
        name: row.spaces.name,
        template: row.spaces.template,
        role: row.role,
      })),
    )
  }

  create = (name: string, template: SpaceTemplateId) =>
    settle(this.db.rpc("create_space", { space_name: name, space_template: template }), unchanged)

  rename = (spaceId: string, name: string, template: SpaceTemplateId) =>
    done(this.db.from("spaces").update({ name, template }).eq("id", spaceId))

  members(spaceId: string): Promise<Result<Member[]>> {
    const query = this.db
      .from("space_members")
      .select("user_id, role, joined_at, profiles!inner(display_name)")
      .eq("space_id", spaceId)
      .order("joined_at")
    return settle(query, (rows) =>
      rows.map((row) => ({
        userId: row.user_id,
        role: row.role,
        joinedAt: row.joined_at,
        displayName: row.profiles.display_name,
      })),
    )
  }

  leave = (spaceId: string) => done(this.db.rpc("leave_space", { target_space: spaceId }))
  removeMember = (spaceId: string, userId: string) =>
    done(this.db.rpc("remove_member", { target_space: spaceId, member: userId }))
  transferOwnership = (spaceId: string, userId: string) =>
    done(this.db.rpc("transfer_ownership", { target_space: spaceId, new_owner: userId }))
  delete = (spaceId: string, confirmName: string) =>
    done(this.db.rpc("delete_space", { target_space: spaceId, confirm_name: confirmName }))

  invites = (spaceId: string) => invitesOf(this.db, spaceId)
  createInvite = (spaceId: string) =>
    settle(this.db.rpc("create_invite", { target_space: spaceId }), unchanged)
  revokeInvite = (inviteId: string) => done(this.db.rpc("revoke_invite", { invite: inviteId }))
  previewInvite = (token: string) => previewOf(this.db, token)
  redeemInvite = (token: string) => settle(this.db.rpc("redeem_invite", { token }), unchanged)
}
