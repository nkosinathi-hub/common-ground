import { failure, success, type Outcome } from "./outcome.ts"
import { DOWNLOAD_SECONDS, type AttachmentsGate, type AttachmentsStore } from "./ports.ts"
import type { ObjectStorage } from "./ports.ts"
import { judgeUpload } from "./probe.ts"
import { checkUpload } from "./rules.ts"
import type { AttachmentDto, AttachmentRow } from "./types.ts"

export interface Caller {
  readonly token: string
  readonly userId: string
}

export interface StartInput {
  readonly spaceId: string
  readonly ideaId: string
  readonly filename: string
  readonly mime: string
  readonly bytes: number
}

export const toDto = (row: AttachmentRow): AttachmentDto => ({
  id: row.id,
  spaceId: row.spaceId,
  ideaId: row.ideaId,
  uploaderId: row.uploaderId,
  filename: row.filename,
  mime: row.declaredMime,
  bytes: row.bytes,
  createdAt: row.createdAt,
})

export interface ServiceDeps {
  readonly gate: AttachmentsGate
  readonly store: AttachmentsStore
  readonly storage: ObjectStorage
}

export function createAttachmentsService({ gate, store, storage }: ServiceDeps) {
  return {
    /** Checks the intent and membership, then issues a signed upload URL for a pending row. */
    async start(caller: Caller, input: StartInput) {
      const upload = checkUpload(input)
      if (!upload.ok) return failure("validation", upload.message)
      if (!(await gate.isMember(caller.token, input.spaceId))) return failure("denied")
      if (!(await gate.consume(caller.userId))) return failure("rate_limited")
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
      const row = await store.find(attachmentId)
      if (!row || row.status !== "pending" || row.uploaderId !== caller.userId)
        return failure("not_found", "This upload could not be found")
      if (!(await gate.isMember(caller.token, row.spaceId))) return failure("denied")
      const verdict = judgeUpload(row, await storage.probe(row.objectPath))
      if (!verdict.ok) {
        await storage.remove([row.objectPath])
        await store.markRejected(row.id)
        return failure("validation", verdict.reason)
      }
      const ready = await store.markReady(row.id, verdict.mime)
      return ready ? success(toDto(ready)) : failure("not_found", "This upload could not be found")
    },

    /** A 60 second signed URL for a finalized file, for members of its space only. */
    async download(caller: Caller, attachmentId: string, disposition: "inline" | "attachment") {
      const row = await store.find(attachmentId)
      if (!row || row.status !== "ready") return failure("not_found")
      if (!(await gate.isMember(caller.token, row.spaceId))) return failure("denied")
      const downloadAs = disposition === "attachment" ? row.filename : undefined
      const url = await storage.signedUrl(row.objectPath, DOWNLOAD_SECONDS, downloadAs)
      return success({ url, expiresIn: DOWNLOAD_SECONDS })
    },
  }
}

export type AttachmentsService = ReturnType<typeof createAttachmentsService>
