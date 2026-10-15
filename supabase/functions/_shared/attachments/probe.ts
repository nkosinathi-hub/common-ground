import { PROBE_BYTES, sniffMime } from "./magic.ts"
import { checkSize } from "./rules.ts"
import type { AttachmentMime, AttachmentRow } from "./types.ts"

/** The first bytes of an uploaded object and its total size. */
export interface Probe {
  readonly head: Uint8Array
  readonly total: number
}

interface RangeReply {
  readonly status: number
  readonly contentRange: string | null
  readonly contentLength: string | null
  readonly body: Uint8Array
}

type Verdict = { ok: true; mime: AttachmentMime } | { ok: false; reason: string }

type Fetch = (url: string, init: RequestInit) => Promise<Response>

/** Storage answers a ranged read quickly; a slow one fails finalize with 503 and can be retried. */
const PROBE_TIMEOUT_MS = 10_000

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

/** Fetches the leading bytes of a signed object URL, giving up after the timeout. */
export async function fetchProbe(send: Fetch, url: string, timeoutMs = PROBE_TIMEOUT_MS) {
  const response = await send(url, {
    headers: { Range: `bytes=0-${PROBE_BYTES - 1}` },
    signal: AbortSignal.timeout(timeoutMs),
  })
  const reply = {
    status: response.status,
    contentRange: response.headers.get("content-range"),
    contentLength: response.headers.get("content-length"),
    body: new Uint8Array(await response.arrayBuffer()),
  }
  return readProbe(reply, PROBE_BYTES)
}

/** Decides whether an upload is what it was declared to be. */
export function judgeUpload(
  row: Pick<AttachmentRow, "declaredMime" | "bytes">,
  probe: Probe | null,
): Verdict {
  const verdict = (reason: string): Verdict => ({ ok: false, reason })
  if (!probe) return verdict("The upload did not arrive. Try again")
  const size = checkSize(probe.total)
  if (!size.ok) return verdict(size.message)
  if (probe.total !== row.bytes)
    return verdict("The uploaded file does not match its declared size")
  const sniffed = sniffMime(probe.head)
  if (sniffed !== row.declaredMime)
    return verdict("This file's contents do not match its type, so it was not attached")
  return { ok: true, mime: sniffed }
}
