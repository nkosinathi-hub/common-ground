import { sniffMime } from "./magic.ts"
import { checkSize } from "./rules.ts"
import type { AttachmentMime, AttachmentRow } from "./types.ts"

/** The first bytes of an uploaded object and its total size. */
export interface Probe {
  readonly head: Uint8Array
  readonly total: number
}

export interface RangeReply {
  readonly status: number
  readonly contentRange: string | null
  readonly contentLength: string | null
  readonly body: Uint8Array
}

/**
 * Reads a reply to `Range: bytes=0-N`. A 206 carries the size in Content-Range; a server
 * that ignores Range answers 200 with the whole object. Anything else means no object.
 */
export function readProbe(reply: RangeReply, probeBytes: number): Probe | null {
  if (reply.status === 206) {
    const total = /^bytes \d+-\d+\/(\d+)$/.exec(reply.contentRange ?? "")?.[1]
    if (!total) return null
    return { head: reply.body.slice(0, probeBytes), total: Number(total) }
  }
  if (reply.status === 200) {
    const length = Number(reply.contentLength ?? reply.body.length)
    return { head: reply.body.slice(0, probeBytes), total: Math.max(length, reply.body.length) }
  }
  return null
}

export type Verdict = { ok: true; mime: AttachmentMime } | { ok: false; reason: string }

/** Decides whether an upload is what it was declared to be. */
export function judgeUpload(
  row: Pick<AttachmentRow, "declaredMime" | "bytes">,
  probe: Probe | null,
) {
  const verdict = (reason: string): Verdict => ({ ok: false, reason })
  if (!probe) return verdict("The upload did not arrive. Try again")
  const size = checkSize(probe.total)
  if (!size.ok) return verdict(size.message)
  if (probe.total !== row.bytes)
    return verdict("The uploaded file does not match its declared size")
  const sniffed = sniffMime(probe.head)
  if (sniffed !== row.declaredMime)
    return verdict("This file's contents do not match its type, so it was not attached")
  return { ok: true, mime: sniffed } as Verdict
}
