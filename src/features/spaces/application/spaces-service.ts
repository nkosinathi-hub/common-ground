import { map, ok, type Result } from "@/shared/domain"
import {
  chooseActiveSpace,
  inviteAt,
  inviteLink,
  validateSpaceName,
  type Invite,
} from "../domain/space"
import type { SpaceTemplateId } from "../domain/templates"
import { MediaUrls, SIGNED_SECONDS } from "./media-urls"
import type { LoadedSpaces, SpacesDeps } from "./ports"
import { SpaceProfileService } from "./space-profile-service"

/** Membership, invites and the space list; `profile` and `media` handle customisation. */
export class SpacesService {
  readonly profile: SpaceProfileService
  readonly media: MediaUrls

  constructor(private readonly deps: SpacesDeps) {
    const { gateway, clock } = deps
    this.profile = new SpaceProfileService(gateway, deps.newId)
    this.media = new MediaUrls(
      (paths) => gateway.signMedia(paths, SIGNED_SECONDS),
      () => +clock(),
    )
  }

  async load(): Promise<Result<LoadedSpaces>> {
    const spaces = await this.deps.gateway.listMine()
    if (!spaces.ok) return spaces
    const active = chooseActiveSpace(spaces.value, this.deps.active.read())
    this.deps.active.write(active?.id ?? null)
    return ok({ spaces: spaces.value, active })
  }

  select = (spaceId: string) => this.deps.active.write(spaceId)
  forget = () => this.deps.active.write(null)

  async create(name: string, template: SpaceTemplateId): Promise<Result<string>> {
    const valid = validateSpaceName(name)
    if (!valid.ok) return valid
    const created = await this.deps.gateway.create(valid.value, template)
    if (created.ok) this.deps.active.write(created.value)
    return created
  }

  members = (spaceId: string) => this.deps.gateway.members(spaceId)
  knownPeople = () => this.deps.gateway.knownPeople()
  revokeInvite = (inviteId: string) => this.deps.gateway.revokeInvite(inviteId)
  removeMember = (spaceId: string, userId: string) =>
    this.deps.gateway.removeMember(spaceId, userId)
  transferOwnership = (spaceId: string, userId: string) =>
    this.deps.gateway.transferOwnership(spaceId, userId)
  previewInvite = (token: string) => this.deps.gateway.previewInvite(token)

  async invites(spaceId: string): Promise<Result<Invite[]>> {
    const now = this.deps.clock()
    const records = await this.deps.gateway.invites(spaceId)
    return map(records, (list) => list.map((record) => inviteAt(record, now)))
  }

  async leave(spaceId: string): Promise<Result<void>> {
    const left = await this.deps.gateway.leave(spaceId)
    if (left.ok) this.forgetIfActive(spaceId)
    return left
  }

  async createInviteLink(spaceId: string): Promise<Result<string>> {
    const token = await this.deps.gateway.createInvite(spaceId)
    return map(token, (value) => inviteLink(this.deps.appUrl, value))
  }

  async redeemInvite(token: string): Promise<Result<string>> {
    const joined = await this.deps.gateway.redeemInvite(token)
    if (joined.ok) this.deps.active.write(joined.value)
    return joined
  }

  /** Destructive: requires the password again and the exact space name. */
  async delete(spaceId: string, confirmName: string, password: string): Promise<Result<void>> {
    const fresh = await this.deps.auth.reauthenticate(password)
    if (!fresh.ok) return fresh
    const deleted = await this.deps.gateway.delete(spaceId, confirmName)
    if (deleted.ok) this.forgetIfActive(spaceId)
    return deleted
  }

  private forgetIfActive(spaceId: string) {
    if (this.deps.active.read() === spaceId) this.forget()
  }
}
