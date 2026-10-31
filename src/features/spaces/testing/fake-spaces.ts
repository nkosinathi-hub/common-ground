import { appError, err, ok, type Result } from "@/shared/domain"
import type { ActiveSpaceStore, SpacesGateway } from "../application/ports"
import type { InviteRecord, Member, Space } from "../domain/space"
import { FakeSpaceProfile } from "./fake-space-profile"
import { sampleSpace } from "./sample-space"

export class MemoryActiveSpace implements ActiveSpaceStore {
  value: string | null = null
  read = () => this.value
  write(spaceId: string | null) {
    this.value = spaceId
  }
}

export class FakeSpacesGateway extends FakeSpaceProfile implements SpacesGateway {
  memberList: Member[] = []
  inviteList: InviteRecord[] = []
  tokens = new Map<string, string>()
  calls: string[] = []

  async listMine(): Promise<Result<Space[]>> {
    return ok([...this.spaces])
  }
  async create(name: string, template: Space["template"]) {
    const id = `space-${this.spaces.length + 1}`
    this.spaces.push(sampleSpace({ id, name, template }))
    return ok(id)
  }
  members = async () => ok([...this.memberList])
  knownPeople = async () =>
    ok(this.memberList.map((m) => ({ id: m.userId, displayName: m.displayName })))
  invites = async () => ok([...this.inviteList])
  async leave(spaceId: string) {
    this.spaces = this.spaces.filter((s) => s.id !== spaceId)
    return ok(undefined)
  }
  async removeMember(_space: string, userId: string) {
    this.calls.push(`remove:${userId}`)
    return ok(undefined)
  }
  async makeOwner(_space: string, userId: string) {
    this.calls.push(`owner:${userId}`)
    return ok(undefined)
  }
  async removeOwner(_space: string, userId: string) {
    this.calls.push(`member:${userId}`)
    return ok(undefined)
  }
  async delete(spaceId: string, confirmName: string) {
    const space = this.spaces.find((s) => s.id === spaceId)
    if (space?.name !== confirmName) return err(appError("validation", "Name does not match"))
    return this.leave(spaceId)
  }
  async createInvite(spaceId: string) {
    const token = `token-${this.tokens.size + 1}`
    this.tokens.set(token, spaceId)
    return ok(token)
  }
  revokeInvite = async () => ok(undefined)
  async previewInvite(token: string) {
    const valid = this.tokens.has(token)
    return ok({
      spaceName: valid ? "Us" : null,
      inviterName: null,
      status: valid ? "valid" : "invalid",
    } as const)
  }
  async redeemInvite(token: string) {
    const spaceId = this.tokens.get(token)
    if (!spaceId) return err(appError("validation", "This invitation is no longer valid"))
    this.tokens.delete(token)
    return ok(spaceId)
  }
}
