import { ALLOWED_TYPES, MAX_BYTES, type AttachmentMime } from "./types.ts"

export type Checked<T> = { ok: true; value: T } | { ok: false; message: string }

export interface UploadIntent {
  readonly filename: string
  readonly mime: string
  readonly bytes: number
}

export interface ValidUpload {
  readonly filename: string
  readonly mime: AttachmentMime
  readonly bytes: number
}

const hasForbidden = (name: string): boolean =>
  [...name].some(
    (c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f || c === "/" || c === "\\",
  )

export const isAllowedMime = (mime: string): mime is AttachmentMime =>
  Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, mime)

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot <= 0 ? "" : filename.slice(dot + 1).toLowerCase()
}

export function checkFilename(raw: string): Checked<string> {
  const filename = raw.trim()
  if (filename.length < 1 || filename.length > 200)
    return { ok: false, message: "File names must be 1 to 200 characters" }
  if (hasForbidden(filename))
    return { ok: false, message: "File names cannot contain slashes or control characters" }
  return { ok: true, value: filename }
}

export function checkSize(bytes: number): Checked<number> {
  if (!Number.isSafeInteger(bytes) || bytes < 1) return { ok: false, message: "The file is empty" }
  if (bytes > MAX_BYTES) return { ok: false, message: "Files can be at most 10 MB" }
  return { ok: true, value: bytes }
}

/** The declared type must be allowed and match the filename extension. */
export function checkUpload(intent: UploadIntent): Checked<ValidUpload> {
  const name = checkFilename(intent.filename)
  if (!name.ok) return name
  if (!isAllowedMime(intent.mime))
    return { ok: false, message: "Only JPEG, PNG, WebP and PDF files can be attached" }
  const extensions: readonly string[] = ALLOWED_TYPES[intent.mime]
  if (!extensions.includes(extensionOf(name.value)))
    return { ok: false, message: "The file extension does not match its type" }
  const size = checkSize(intent.bytes)
  if (!size.ok) return size
  return { ok: true, value: { filename: name.value, mime: intent.mime, bytes: size.value } }
}
