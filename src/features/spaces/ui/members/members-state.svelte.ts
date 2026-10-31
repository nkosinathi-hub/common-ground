import { navigate, Resource, toast } from "@/shared/ui"
import type { SpacesService } from "../../application/spaces-service"
import type { Invite, Member, Space } from "../../domain/space"
import type { SpacesStore } from "../spaces-store.svelte"
import { MEMBER_ACTIONS, type MemberAction } from "../member-actions"

/** Members & safety: the people and links of a space, and every change made to them. */
export class MembersState {
  readonly members: Resource<Member[]>
  readonly invites: Resource<Invite[]>
  pending = $state<{ member: Member; action: MemberAction } | null>(null)
  asking = $state(false)

  constructor(
    private readonly service: SpacesService,
    private readonly store: SpacesStore,
    private readonly space: () => Space,
  ) {
    this.members = new Resource(() => service.members(space().id))
    this.invites = new Resource(() => service.invites(space().id))
  }

  load = () => Promise.all([this.members.load(), this.invites.load()])

  ask = (member: Member, action: MemberAction) => {
    this.pending = { member, action }
    this.asking = true
  }

  confirm = async () => {
    if (!this.pending) return
    const { member, action } = this.pending
    const id = this.space().id
    const run = {
      remove: this.service.removeMember,
      makeOwner: this.service.makeOwner,
      removeOwner: this.service.removeOwner,
    }[action]
    const result = await run(id, member.userId)
    if (!result.ok) return void toast.error(result.error.message)
    toast.success(MEMBER_ACTIONS[action].done(member.displayName))
    await Promise.all([this.members.load(), this.store.refresh()])
  }

  create = async (): Promise<string | null> => {
    const made = await this.service.createInviteLink(this.space().id)
    if (!made.ok) return (toast.error(made.error.message), null)
    await this.invites.load()
    return made.value
  }

  revoke = async (id: string) => {
    const revoked = await this.service.revokeInvite(id)
    if (!revoked.ok) return void toast.error(revoked.error.message)
    await this.invites.load()
  }

  leave = async () => {
    const left = await this.service.leave(this.space().id)
    if (!left.ok) return void toast.error(left.error.message)
    await this.store.refresh()
    navigate({ name: "entry" })
  }
}
