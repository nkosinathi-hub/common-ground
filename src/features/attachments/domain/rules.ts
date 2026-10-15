import { appError, err, ok, type Result } from "@/shared/domain"
import type { AttachmentKind, AttachmentMime } from "./types"

export const MAX_BYTES = 10 * 1024 * 1024

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

const isMime = (value: string): value is AttachmentMime => Object.hasOwn(EXTENSIONS, value)

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
  if (!isMime(mime) || !EXTENSIONS[mime].includes(extensionOf(name)))
    return err(appError("validation", "Only JPEG, PNG, WebP and PDF files can be attached"))
  if (file.size < 1) return err(appError("validation", "This file is empty"))
  if (file.size > MAX_BYTES) return err(appError("validation", "Files can be at most 10 MB"))
  if (name.length > 200)
    return err(appError("validation", "File names can be at most 200 characters"))
  return ok(mime)
}

export const kindOf = (mime: AttachmentMime): AttachmentKind =>
  mime === "application/pdf" ? "pdf" : "image"

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Delete is offered to the uploader and to the space owner; the RPC enforces the same rule. */
export const canDelete = (uploaderId: string | null, me: string, isOwner: boolean): boolean =>
  isOwner || (uploaderId !== null && uploaderId === me)
