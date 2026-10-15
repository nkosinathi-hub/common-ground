import { isUuid } from "./paths.ts"
import type { Checked } from "./rules.ts"

export type AttachmentsRequest =
  | {
      readonly action: "start"
      readonly spaceId: string
      readonly ideaId: string
      readonly filename: string
      readonly mime: string
      readonly bytes: number
    }
  | { readonly action: "finalize"; readonly attachmentId: string }
  | {
      readonly action: "download"
      readonly attachmentId: string
      readonly disposition: "inline" | "attachment"
    }
  | { readonly action: "cleanup" }

const fail = (message: string): Checked<AttachmentsRequest> => ({ ok: false, message })

function parseStart(body: Record<string, unknown>): Checked<AttachmentsRequest> {
  if (!isUuid(body.spaceId) || !isUuid(body.ideaId)) return fail("Choose an idea first")
  if (typeof body.filename !== "string" || typeof body.mime !== "string")
    return fail("Choose a file")
  if (typeof body.bytes !== "number") return fail("Choose a file")
  const { spaceId, ideaId, filename, mime, bytes } = body
  return { ok: true, value: { action: "start", spaceId, ideaId, filename, mime, bytes } }
}

/** Shape-checks a request body. Upload rules (type, size, name) are checked by checkUpload. */
export function parseRequest(raw: unknown): Checked<AttachmentsRequest> {
  if (typeof raw !== "object" || raw === null) return fail("Invalid request")
  const body = raw as Record<string, unknown>
  if (body.action === "start") return parseStart(body)
  if (body.action === "cleanup") return { ok: true, value: { action: "cleanup" } }
  if (body.action !== "finalize" && body.action !== "download")
    return fail("Unknown attachments action")
  if (!isUuid(body.attachmentId)) return fail("Choose an attachment")
  const attachmentId = body.attachmentId.toLowerCase()
  if (body.action === "finalize") return { ok: true, value: { action: "finalize", attachmentId } }
  const disposition = body.disposition ?? "inline"
  if (disposition !== "inline" && disposition !== "attachment")
    return fail("Choose inline or attachment")
  return { ok: true, value: { action: "download", attachmentId, disposition } }
}
