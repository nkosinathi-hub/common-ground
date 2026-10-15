import { appError, err, ok } from "@/shared/domain"
import type { ActiveSpaceStore, SpacesGateway } from "../application/ports"
import type { Invite, Member, Space } from "../domain/space"

export class MemoryActiveSpace implements ActiveSpaceStore {
  value: string | null = null
  read = () => this.value
  write = (id: string | null) => void (this.value = id)
}

export class FakeSpacesGateway implements SpacesGateway {
  spaces: Space[] = []
  memberList: Member[] = []
  inviteList: Invite[] = []
  tokens = new Map<string, string>()
  calls: string[] = []

  async listMine() {
    return ok([...this.spaces])
  }
  async create(name: string, template: Space["template"]) {
    const id = `space-${this.spaces.length + 1}`
    this.spaces.push({ id, name, template, role: "owner" })
    return ok(id)
  }
  async rename(spaceId: string, name: string) {
    this.spaces = this.spaces.map((s) => (s.id === spaceId ? { ...s, name } : s))
    return ok(undefined)
  }
  members = async () => ok([...this.memberList])
  invites = async () => ok([...this.inviteList])
  async leave(spaceId: string) {
    this.spaces = this.spaces.filter((s) => s.id !== spaceId)
    return ok(undefined)
  }
  async removeMember(_space: string, userId: string) {
    this.calls.push(`remove:${userId}`)
    return ok(undefined)
  }
  async transferOwnership(_space: string, userId: string) {
    this.calls.push(`transfer:${userId}`)
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
