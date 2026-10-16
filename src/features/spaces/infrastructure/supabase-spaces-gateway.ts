import type { Result } from "@/shared/domain"
import { done, same, settle, signedOut } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { SpacesGateway } from "../application/ports"
import type { Member, Space } from "../domain/space"
import type { SpaceTemplateId } from "../domain/templates"
import { toSpace } from "./space-row"
import { invitesOf, previewOf } from "./supabase-invites"
import { SupabaseSpaceProfile } from "./supabase-space-profile"

const SPACE_SELECT =
  "role, spaces!inner(id, name, template, tagline, description, theme, accent_color, icon, avatar_path, cover_path, home_cards, default_watch_intent, week_starts_on)"

export class SupabaseSpacesGateway implements SpacesGateway {
  private readonly profile: SupabaseSpaceProfile

  constructor(private readonly db: Db) {
    this.profile = new SupabaseSpaceProfile(db)
  }

  async listMine(): Promise<Result<Space[]>> {
    const { data } = await this.db.auth.getUser()
    if (!data.user) return signedOut()
    const query = this.db
      .from("space_members")
      .select(SPACE_SELECT)
      .eq("user_id", data.user.id)
      .order("joined_at")
    return settle(query, (rows) => rows.map((row) => toSpace(row.spaces, row.role)))
  }

  create = (name: string, template: SpaceTemplateId) =>
    settle(this.db.rpc("create_space", { space_name: name, space_template: template }), same)

  updateProfile: SpacesGateway["updateProfile"] = (...args) => this.profile.updateProfile(...args)
  uploadMedia: SpacesGateway["uploadMedia"] = (...args) => this.profile.uploadMedia(...args)
  setMedia: SpacesGateway["setMedia"] = (...args) => this.profile.setMedia(...args)
  removeMedia: SpacesGateway["removeMedia"] = (...args) => this.profile.removeMedia(...args)
  signMedia: SpacesGateway["signMedia"] = (...args) => this.profile.signMedia(...args)

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

  knownPeople = () =>
    settle(this.db.from("profiles").select("id, display_name"), (rows) =>
      rows.map((row) => ({ id: row.id, displayName: row.display_name })),
    )

  leave = (spaceId: string) => done(this.db.rpc("leave_space", { target_space: spaceId }))
  removeMember = (spaceId: string, userId: string) =>
    done(this.db.rpc("remove_member", { target_space: spaceId, member: userId }))
  transferOwnership = (spaceId: string, userId: string) =>
    done(this.db.rpc("transfer_ownership", { target_space: spaceId, new_owner: userId }))
  delete = (spaceId: string, confirmName: string) =>
    done(this.db.rpc("delete_space", { target_space: spaceId, confirm_name: confirmName }))

  invites = (spaceId: string) => invitesOf(this.db, spaceId)
  createInvite = (spaceId: string) =>
    settle(this.db.rpc("create_invite", { target_space: spaceId }), same)
  revokeInvite = (inviteId: string) => done(this.db.rpc("revoke_invite", { invite: inviteId }))
  previewInvite = (token: string) => previewOf(this.db, token)
  redeemInvite = (token: string) => settle(this.db.rpc("redeem_invite", { token }), same)
}
