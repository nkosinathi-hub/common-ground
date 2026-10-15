// In-memory ports for Vitest. Not used by the deployed function.
import { PROBE_BYTES } from "./magic.ts"
import { buildObjectPath } from "./paths.ts"
import type { AttachmentsStore, CleanupCandidate, ObjectStorage, PendingUpload } from "./ports.ts"
import type { Probe } from "./probe.ts"
import type { AttachmentMime, AttachmentRow } from "./types.ts"

let counter = 0
const nextId = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`

export class MemoryStore implements AttachmentsStore {
  readonly rows = new Map<string, AttachmentRow>()
  readonly ideas = new Set<string>()
  candidates: CleanupCandidate[] = []
  readonly deleted: string[] = []

  async ideaInSpace(spaceId: string, ideaId: string) {
    return this.ideas.has(`${spaceId}/${ideaId}`)
  }

  async createPending(upload: PendingUpload): Promise<AttachmentRow> {
    const id = nextId()
    const row: AttachmentRow = {
      id,
      spaceId: upload.spaceId,
      ideaId: upload.ideaId,
      uploaderId: upload.uploaderId,
      objectPath: buildObjectPath({ spaceId: upload.spaceId, ideaId: upload.ideaId, uploadId: id }),
      filename: upload.filename,
      declaredMime: upload.mime,
      bytes: upload.bytes,
      status: "pending",
      createdAt: "2026-10-15T10:00:00.000Z",
    }
    this.rows.set(id, row)
    return row
  }

  async find(id: string) {
    return this.rows.get(id) ?? null
  }

  async markReady(id: string, _mime: AttachmentMime) {
    const row = this.rows.get(id)
    if (!row || row.status !== "pending") return null
    const ready = { ...row, status: "ready" as const }
    this.rows.set(id, ready)
    return ready
  }

  async markRejected(id: string) {
    const row = this.rows.get(id)
    if (row) this.rows.set(id, { ...row, status: "rejected" })
  }

  async cleanupCandidates() {
    return this.candidates
  }

  async deleteRows(ids: readonly string[]) {
    for (const id of ids) this.rows.delete(id)
    this.deleted.push(...ids)
  }
}

export class MemoryStorage implements ObjectStorage {
  readonly objects = new Map<string, Uint8Array>()
  readonly removed: string[] = []
  readonly signed: { path: string; seconds: number; downloadAs?: string }[] = []
  failRemove = false

  async signedUploadUrl(path: string) {
    return `https://storage.test/upload/sign/attachments/${path}?token=t`
  }

  async probe(path: string): Promise<Probe | null> {
    const bytes = this.objects.get(path)
    return bytes ? { head: bytes.slice(0, PROBE_BYTES), total: bytes.length } : null
  }

  async signedUrl(path: string, seconds: number, downloadAs?: string) {
    this.signed.push({ path, seconds, downloadAs })
    return `https://storage.test/sign/attachments/${path}?token=d`
  }

  async remove(paths: readonly string[]) {
    if (this.failRemove) throw new Error("storage down")
    for (const path of paths) this.objects.delete(path)
    this.removed.push(...paths)
  }
}
