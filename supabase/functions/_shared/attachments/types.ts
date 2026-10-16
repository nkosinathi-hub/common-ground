// Shared vocabulary of the attachments Edge Function. Mirrored by src/features/attachments/domain.
export const BYTES_MAX = 10 * 1024 * 1024
export const FILENAME_MAX = 200

/** Allowed types and the filename extensions that may declare them. */
export const ALLOWED_TYPES = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
} as const

export type AttachmentMime = keyof typeof ALLOWED_TYPES

type AttachmentStatus = "pending" | "ready" | "rejected"

export interface AttachmentRow {
  readonly id: string
  readonly spaceId: string
  readonly ideaId: string
  readonly uploaderId: string | null
  readonly objectPath: string
  readonly filename: string
  readonly declaredMime: AttachmentMime
  readonly bytes: number
  readonly status: AttachmentStatus
  readonly createdAt: string
}

/** A finalized attachment as returned to clients. */
export interface AttachmentDto {
  readonly id: string
  readonly spaceId: string
  readonly ideaId: string
  readonly uploaderId: string | null
  readonly filename: string
  readonly mime: AttachmentMime
  readonly bytes: number
  readonly createdAt: string
}
