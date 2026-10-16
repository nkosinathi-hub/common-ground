import { appError, err, ok, type Result } from "@/shared/domain"
import type { AttachmentKind, AttachmentMime } from "./types"

const KB = 1024
const MB = 1024 * KB

export const BYTES_MAX = 10 * MB
export const FILENAME_MAX = 200

const EXTENSIONS: Record<AttachmentMime, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
}

/** For the file input `accept` attribute. */
export const ACCEPT = [...Object.keys(EXTENSIONS), ".jpg", ".jpeg", ".png", ".webp", ".pdf"].join(
  ",",
)

export const isAttachmentMime = (value: string): value is AttachmentMime =>
  Object.hasOwn(EXTENSIONS, value)

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf(".")
  return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase()
}

/** The type implied by a filename extension, used when the browser reports none. */
export function mimeFromName(name: string): AttachmentMime | null {
  const extension = extensionOf(name)
  const match = Object.entries(EXTENSIONS).find(([, list]) => list.includes(extension))
  return match ? (match[0] as AttachmentMime) : null
}

/** Whole megabytes print without a decimal: 10 MB, 3.5 MB. */
export function formatBytes(bytes: number): string {
  if (bytes < KB) return `${bytes} B`
  if (bytes < MB) return `${Math.round(bytes / KB)} KB`
  return `${Number((bytes / MB).toFixed(1))} MB`
}

/**
 * A convenience precheck so people learn early that a file will not fit. It is NOT a
 * security control: the Edge Function re-checks everything and verifies the magic bytes.
 */
export function precheckFile(file: {
  name: string
  type: string
  size: number
}): Result<AttachmentMime> {
  const name = file.name.trim()
  const mime = file.type || mimeFromName(name) || ""
  if (!isAttachmentMime(mime) || !EXTENSIONS[mime].includes(extensionOf(name)))
    return err(appError("validation", "Only JPEG, PNG, WebP and PDF files can be attached"))
  if (file.size < 1) return err(appError("validation", "This file is empty"))
  if (file.size > BYTES_MAX)
    return err(appError("validation", `Files can be at most ${formatBytes(BYTES_MAX)}`))
  if (name.length > FILENAME_MAX)
    return err(appError("validation", `File names can be at most ${FILENAME_MAX} characters`))
  return ok(mime)
}

export const kindOf = (mime: AttachmentMime): AttachmentKind =>
  mime === "application/pdf" ? "pdf" : "image"

/** Delete is offered to the uploader and to the space owner; the RPC enforces the same rule. */
export const canDelete = (uploaderId: string | null, me: string, isOwner: boolean): boolean =>
  isOwner || (uploaderId !== null && uploaderId === me)

/** Signed URLs come from the server; anything but http(s) is never rendered or opened. */
export function isWebUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === "https:" || protocol === "http:"
  } catch {
    return false
  }
}
