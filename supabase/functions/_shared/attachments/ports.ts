import type { Probe } from "./probe.ts"
import type { AttachmentMime, AttachmentRow } from "./types.ts"

export const RATE_LIMIT = { bucket: "attachments_start", max: 20, windowSeconds: 3600 } as const
export const DOWNLOAD_SECONDS = 60

/** Caller checks; the Edge Function entry implements them with Supabase. */
export interface AttachmentsGate {
  /** Verifies the caller JWT and returns its user id, or null. */
  userFor(token: string): Promise<string | null>
  /** public.is_space_member called as the caller. */
  isMember(token: string, spaceId: string): Promise<boolean>
  /** Consumes one upload start from the caller's rate-limit bucket. */
  consume(userId: string): Promise<boolean>
}

export interface PendingUpload {
  readonly spaceId: string
  readonly ideaId: string
  readonly uploaderId: string
  readonly filename: string
  readonly mime: AttachmentMime
  readonly bytes: number
}

export interface CleanupCandidate {
  readonly attachmentId: string | null
  readonly objectPath: string
}

/** public.attachments through the service-role client. */
export interface AttachmentsStore {
  ideaInSpace(spaceId: string, ideaId: string): Promise<boolean>
  createPending(upload: PendingUpload): Promise<AttachmentRow>
  find(attachmentId: string): Promise<AttachmentRow | null>
  /** Marks a pending row ready; returns the updated row, or null if it was no longer pending. */
  markReady(attachmentId: string, mime: AttachmentMime): Promise<AttachmentRow | null>
  markRejected(attachmentId: string): Promise<void>
  cleanupCandidates(): Promise<CleanupCandidate[]>
  deleteRows(attachmentIds: readonly string[]): Promise<void>
}

/** The private attachments bucket through the service-role client. */
export interface ObjectStorage {
  signedUploadUrl(path: string): Promise<string>
  /** Reads the first bytes and size of an object, or null when it does not exist. */
  probe(path: string): Promise<Probe | null>
  signedUrl(path: string, seconds: number, downloadAs?: string): Promise<string>
  remove(paths: readonly string[]): Promise<void>
}
