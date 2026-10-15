import type { Gate } from "../http/gate.ts"
import { success, type Outcome } from "../http/outcome.ts"
import { failure } from "./outcome.ts"
import {
  DOWNLOAD_SECONDS,
  RATE_LIMITS,
  type AttachmentsStore,
  type ObjectStorage,
} from "./ports.ts"
import { judgeUpload } from "./probe.ts"
import { checkUpload, type UploadIntent } from "./rules.ts"
import type { AttachmentDto, AttachmentRow } from "./types.ts"

export interface Caller {
  readonly token: string
  readonly userId: string
}

interface StartInput extends UploadIntent {
  readonly spaceId: string
  readonly ideaId: string
}

interface ServiceDeps {
  readonly gate: Gate
  readonly store: AttachmentsStore
  readonly storage: ObjectStorage
}

const UPLOAD_GONE = "This upload could not be found"
const BUSY = {
  start: `A little pause: you can upload ${RATE_LIMITS.start.max} files per hour`,
  finalize: "A little pause: too many uploads checked this hour. Try again later",
  download: "A little pause: too many files opened at once. Try again in a minute",
}

const toDto = (row: AttachmentRow): AttachmentDto => ({
  id: row.id,
  spaceId: row.spaceId,
  ideaId: row.ideaId,
  uploaderId: row.uploaderId,
  filename: row.filename,
  mime: row.declaredMime,
  bytes: row.bytes,
  createdAt: row.createdAt,
})

export function createAttachmentsService({ gate, store, storage }: ServiceDeps) {
  const allowed = (caller: Caller, action: keyof typeof RATE_LIMITS) =>
    gate.consume(caller.userId, RATE_LIMITS[action])

  return {
    /** Checks the intent and membership, then issues a signed upload URL for a pending row. */
    async start(caller: Caller, input: StartInput) {
      const upload = checkUpload(input)
      if (!upload.ok) return failure("validation", upload.message)
      if (!(await gate.isMember(caller.token, input.spaceId))) return failure("denied")
      if (!(await allowed(caller, "start"))) return failure("rate_limited", BUSY.start)
      if (!(await store.ideaInSpace(input.spaceId, input.ideaId)))
        return failure("not_found", "This idea could not be found")
      const row = await store.createPending({
        ...input,
        ...upload.value,
        uploaderId: caller.userId,
      })
      const uploadUrl = await storage.signedUploadUrl(row.objectPath)
      return success({ attachmentId: row.id, uploadUrl })
    },

    /** Verifies the uploaded bytes; a spoofed or mis-sized file is deleted and rejected. */
    async finalize(caller: Caller, attachmentId: string): Promise<Outcome<AttachmentDto>> {
      if (!(await allowed(caller, "finalize"))) return failure("rate_limited", BUSY.finalize)
      const row = await store.find(attachmentId)
      if (!row || row.status !== "pending" || row.uploaderId !== caller.userId)
        return failure("not_found", UPLOAD_GONE)
      if (!(await gate.isMember(caller.token, row.spaceId))) return failure("denied")
      const verdict = judgeUpload(row, await storage.probe(row.objectPath))
      if (!verdict.ok) {
        await storage.remove([row.objectPath])
        await store.markRejected(row.id)
        return failure("validation", verdict.reason)
      }
      const ready = await store.markReady(row.id, verdict.mime)
      return ready ? success(toDto(ready)) : failure("not_found", UPLOAD_GONE)
    },

    /** A 60 second signed URL for a finalized file, for members of its space only. */
    async download(caller: Caller, attachmentId: string, disposition: "inline" | "attachment") {
      if (!(await allowed(caller, "download"))) return failure("rate_limited", BUSY.download)
      const row = await store.find(attachmentId)
      if (!row || row.status !== "ready") return failure("not_found")
      if (!(await gate.isMember(caller.token, row.spaceId))) return failure("denied")
      const downloadAs = disposition === "attachment" ? row.filename : undefined
      const url = await storage.signedUrl(row.objectPath, DOWNLOAD_SECONDS, downloadAs)
      return success({ url, expiresIn: DOWNLOAD_SECONDS })
    },
  }
}
