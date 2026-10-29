import type { HomeCardId, MemberRef, Reauthenticator, Result } from "@/shared/domain"
import type { DefaultWatchIntent, WeekStart } from "../domain/look"
import type { MediaSlot } from "../domain/media"
import type { SpaceLook } from "../domain/space-look"
import type { InvitePreview, InviteRecord, Member, Space } from "../domain/space"
import type { SpaceTemplateId } from "../domain/templates"

/** Owner-only columns on a space; only the fields given change. */
export interface SpaceProfilePatch {
  readonly name?: string
  readonly template?: SpaceTemplateId
  readonly tagline?: string
  readonly description?: string
  readonly icon?: string | null
  /** Only what differs from the default (storedLook). */
  readonly look?: Partial<SpaceLook>
  readonly homeCards?: readonly HomeCardId[]
  readonly defaultWatchIntent?: DefaultWatchIntent
  readonly weekStartsOn?: WeekStart
}

/** The space profile and its pictures in the private space-media bucket. */
export interface SpaceProfileGateway {
  updateProfile(spaceId: string, patch: SpaceProfilePatch): Promise<Result<void>>
  uploadMedia(path: string, file: Blob): Promise<Result<void>>
  /** Points the slot at an uploaded object (or none) and returns the previous path. */
  setMedia(spaceId: string, slot: MediaSlot, path: string | null): Promise<Result<string | null>>
  removeMedia(paths: readonly string[]): Promise<Result<void>>
  /** Signed read URLs by path; paths that could not be signed are left out. */
  signMedia(paths: readonly string[], seconds: number): Promise<Result<Record<string, string>>>
}

export interface SpacesGateway extends SpaceProfileGateway {
  listMine(): Promise<Result<Space[]>>
  create(name: string, template: SpaceTemplateId): Promise<Result<string>>
  members(spaceId: string): Promise<Result<Member[]>>
  /** Profiles RLS lets the viewer read: their own and anyone they still share a space with. */
  knownPeople(): Promise<Result<MemberRef[]>>
  leave(spaceId: string): Promise<Result<void>>
  removeMember(spaceId: string, userId: string): Promise<Result<void>>
  transferOwnership(spaceId: string, userId: string): Promise<Result<void>>
  delete(spaceId: string, confirmName: string): Promise<Result<void>>
  invites(spaceId: string): Promise<Result<InviteRecord[]>>
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

export interface SpacesDeps {
  readonly gateway: SpacesGateway
  readonly active: ActiveSpaceStore
  readonly auth: Reauthenticator
  /** The app root that invite links open, for example https://x.github.io/common-ground/. */
  readonly appUrl: string
  /** Decides whether an invite has expired. */
  readonly clock: () => Date
  /** Names uploads; random by default. */
  readonly newId?: () => string
}

export interface LoadedSpaces {
  readonly spaces: Space[]
  readonly active: Space | null
}
