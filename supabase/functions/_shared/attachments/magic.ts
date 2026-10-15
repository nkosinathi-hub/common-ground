import type { AttachmentMime } from "./types.ts"

/** Bytes to read from the start of an object: enough for every signature below. */
export const PROBE_BYTES = 16

const ascii = (text: string): number[] => [...text].map((c) => c.charCodeAt(0))

type Signature = { readonly offset: number; readonly bytes: readonly number[] }

const SIGNATURES: Record<AttachmentMime, readonly Signature[]> = {
  "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  "image/webp": [
    { offset: 0, bytes: ascii("RIFF") },
    { offset: 8, bytes: ascii("WEBP") },
  ],
  "application/pdf": [{ offset: 0, bytes: ascii("%PDF-") }],
}

const matches = (head: Uint8Array, { offset, bytes }: Signature): boolean =>
  bytes.every((byte, i) => head[offset + i] === byte)

/** The type the content really is, judged by its leading magic bytes, or null. */
export function sniffMime(head: Uint8Array): AttachmentMime | null {
  for (const [mime, signatures] of Object.entries(SIGNATURES))
    if (signatures.every((signature) => matches(head, signature))) return mime as AttachmentMime
  return null
}
