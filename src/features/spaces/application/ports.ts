import type { Result } from "@/shared/domain"
import type { Invite, InvitePreview, Member, Space } from "../domain/space"
import type { SpaceTemplateId } from "../domain/templates"

export interface SpacesGateway {
  listMine(): Promise<Result<Space[]>>
  create(name: string, template: SpaceTemplateId): Promise<Result<string>>
  rename(spaceId: string, name: string, template: SpaceTemplateId): Promise<Result<void>>
  members(spaceId: string): Promise<Result<Member[]>>
  leave(spaceId: string): Promise<Result<void>>
  removeMember(spaceId: string, userId: string): Promise<Result<void>>
  transferOwnership(spaceId: string, userId: string): Promise<Result<void>>
  delete(spaceId: string, confirmName: string): Promise<Result<void>>
  invites(spaceId: string): Promise<Result<Invite[]>>
  createInvite(spaceId: string): Promise<Result<string>>
  revokeInvite(inviteId: string): Promise<Result<void>>
  previewInvite(token: string): Promise<Result<InvitePreview>>
  redeemInvite(token: string): Promise<Result<string>>
}

/** Remembers only the active space id; never space content. */
export interface ActiveSpaceStore {
  read(): string | null
  write(spaceId: string | null): void
}

export interface Reauthenticator {
  reauthenticate(password: string): Promise<Result<void>>
}
