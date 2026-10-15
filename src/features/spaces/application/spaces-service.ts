import { map, ok, type Reauthenticator, type Result } from "@/shared/domain"
import {
  chooseActiveSpace,
  inviteAt,
  inviteLink,
  validateSpaceName,
  type Invite,
  type Space,
} from "../domain/space"
import type { SpaceTemplateId } from "../domain/templates"
import type { ActiveSpaceStore, SpacesGateway } from "./ports"

export interface SpacesDeps {
  readonly gateway: SpacesGateway
  readonly active: ActiveSpaceStore
  readonly auth: Reauthenticator
  /** The app root that invite links open, for example https://x.github.io/common-ground/. */
  readonly appUrl: string
  /** Decides whether an invite has expired. */
  readonly clock: () => Date
}

export interface LoadedSpaces {
  readonly spaces: Space[]
  readonly active: Space | null
}

export class SpacesService {
  constructor(private readonly deps: SpacesDeps) {}

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

  async rename(spaceId: string, name: string, template: SpaceTemplateId): Promise<Result<void>> {
    const valid = validateSpaceName(name)
    return valid.ok ? this.deps.gateway.rename(spaceId, valid.value, template) : valid
  }

  members = (spaceId: string) => this.deps.gateway.members(spaceId)
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
