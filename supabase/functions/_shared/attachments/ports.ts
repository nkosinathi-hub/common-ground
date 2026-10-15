import type { RateLimit } from "../http/gate.ts"
import type { Probe } from "./probe.ts"
import type { AttachmentMime, AttachmentRow } from "./types.ts"

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

export const DOWNLOAD_SECONDS = 60

/**
 * One bucket per action. Starts are the expensive part (storage and a pending row); finalize
 * reads object bytes; downloads sign URLs, one per preview, so they get a larger, shorter window.
 */
export const RATE_LIMITS = {
  start: { bucket: "attachments_start", max: 20, windowSeconds: 3600 },
  finalize: { bucket: "attachments_finalize", max: 40, windowSeconds: 3600 },
  download: { bucket: "attachments_download", max: 120, windowSeconds: 60 },
} as const satisfies Record<string, RateLimit>
