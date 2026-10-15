import { type Result } from "@/shared/domain"
import { chooseActiveSpace, inviteLink, validateSpaceName, type Space } from "../domain/space"
import type { SpaceTemplateId } from "../domain/templates"
import type { ActiveSpaceStore, Reauthenticator, SpacesGateway } from "./ports"

export class SpacesService {
  constructor(
    private readonly gateway: SpacesGateway,
    private readonly active: ActiveSpaceStore,
    private readonly auth: Reauthenticator,
    private readonly appUrl: string,
  ) {}

  async load(): Promise<Result<{ spaces: Space[]; active: Space | null }>> {
    const spaces = await this.gateway.listMine()
    if (!spaces.ok) return spaces
    const active = chooseActiveSpace(spaces.value, this.active.read())
    this.active.write(active?.id ?? null)
    return { ok: true, value: { spaces: spaces.value, active } }
  }

  select = (spaceId: string) => this.active.write(spaceId)
  forget = () => this.active.write(null)

  async create(name: string, template: SpaceTemplateId): Promise<Result<string>> {
    const valid = validateSpaceName(name)
    if (!valid.ok) return valid
    const created = await this.gateway.create(valid.value, template)
    if (created.ok) this.active.write(created.value)
    return created
  }

  async rename(spaceId: string, name: string, template: SpaceTemplateId): Promise<Result<void>> {
    const valid = validateSpaceName(name)
    return valid.ok ? this.gateway.rename(spaceId, valid.value, template) : valid
  }

  members = (spaceId: string) => this.gateway.members(spaceId)
  invites = (spaceId: string) => this.gateway.invites(spaceId)
  revokeInvite = (inviteId: string) => this.gateway.revokeInvite(inviteId)
  removeMember = (spaceId: string, userId: string) => this.gateway.removeMember(spaceId, userId)
  transferOwnership = (spaceId: string, userId: string) => this.gateway.transferOwnership(spaceId, userId)
  previewInvite = (token: string) => this.gateway.previewInvite(token)

  async leave(spaceId: string): Promise<Result<void>> {
    const left = await this.gateway.leave(spaceId)
    if (left.ok && this.active.read() === spaceId) this.active.write(null)
    return left
  }

  async createInviteLink(spaceId: string): Promise<Result<string>> {
    const token = await this.gateway.createInvite(spaceId)
    return token.ok ? { ok: true, value: inviteLink(this.appUrl, token.value) } : token
  }

  async redeemInvite(token: string): Promise<Result<string>> {
    const joined = await this.gateway.redeemInvite(token)
    if (joined.ok) this.active.write(joined.value)
    return joined
  }

  /** Destructive: requires the password again and the exact space name. */
  async delete(spaceId: string, confirmName: string, password: string): Promise<Result<void>> {
    const fresh = await this.auth.reauthenticate(password)
    if (!fresh.ok) return fresh
    const deleted = await this.gateway.delete(spaceId, confirmName)
    if (deleted.ok && this.active.read() === spaceId) this.active.write(null)
    return deleted
  }
}
