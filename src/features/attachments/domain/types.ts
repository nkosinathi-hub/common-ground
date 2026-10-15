// Mirrors supabase/functions/_shared/attachments/types.ts (the attachments Edge Function).
export type AttachmentMime = "image/jpeg" | "image/png" | "image/webp" | "application/pdf"
export type AttachmentKind = "image" | "pdf"

/** A finalized, verified attachment of an idea. */
export interface Attachment {
  readonly id: string
  readonly spaceId: string
  readonly ideaId: string
  readonly uploaderId: string | null
  readonly filename: string
  readonly mime: AttachmentMime
  readonly bytes: number
  readonly createdAt: string
}

/** The browser file being attached; a File satisfies it. */
export interface FileLike extends Blob {
  readonly name: string
  readonly type: string
  readonly size: number
}

export type UploadPhase = "starting" | "uploading" | "verifying"

export interface UploadProgress {
  readonly phase: UploadPhase
  readonly loaded: number
  readonly total: number
}
