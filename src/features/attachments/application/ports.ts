import type { Result } from "@/shared/domain"
import type { Attachment, AttachmentMime, FileLike } from "../domain/types"

export interface StartRequest {
  readonly spaceId: string
  readonly ideaId: string
  readonly filename: string
  readonly mime: AttachmentMime
  readonly bytes: number
}

export interface StartedUpload {
  readonly attachmentId: string
  readonly uploadUrl: string
}

export type Disposition = "inline" | "attachment"

/** The attachments Edge Function plus RLS reads and the delete RPC. */
export interface AttachmentsGateway {
  list(spaceId: string, ideaId: string): Promise<Result<Attachment[]>>
  start(request: StartRequest): Promise<Result<StartedUpload>>
  finalize(attachmentId: string): Promise<Result<Attachment>>
  /** A short-lived signed URL (about 60 seconds). */
  signedUrl(attachmentId: string, disposition: Disposition): Promise<Result<string>>
  remove(attachmentId: string): Promise<Result<void>>
}

export interface PutOptions {
  readonly signal?: AbortSignal
  readonly onProgress?: (loaded: number, total: number) => void
}

/** Sends the file body to a signed upload URL. Aborting the signal cancels the request. */
export interface ObjectUploader {
  put(url: string, file: FileLike, mime: AttachmentMime, options: PutOptions): Promise<Result<void>>
}
