import { appError, err, ok, type AppError, type Result } from "@/shared/domain"
import type {
  AttachmentsGateway,
  Disposition,
  ObjectUploader,
  PutRequest,
  StartRequest,
} from "../application/ports"
import type { Attachment, AttachmentMime } from "../domain/types"

export const SPACE_ID = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"
export const IDEA_ID = "1b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f61"

export const attachment = (id: string, extra: Partial<Attachment> = {}): Attachment => ({
  id,
  spaceId: SPACE_ID,
  ideaId: IDEA_ID,
  uploaderId: "me",
  filename: `${id}.png`,
  mime: "image/png",
  bytes: 2048,
  createdAt: "2026-10-15T10:00:00.000Z",
  ...extra,
})

/** In-memory gateway. Set the fail* fields to simulate server refusals. */
export class FakeAttachmentsGateway implements AttachmentsGateway {
  items: Attachment[] = []
  readonly started: StartRequest[] = []
  readonly removed: string[] = []
  readonly urls: { id: string; disposition: Disposition }[] = []
  failStart: AppError | null = null
  failFinalize: AppError | null = null
  failList: AppError | null = null
  signedBase = "https://storage.test/signed/"
  private pending = new Map<string, StartRequest>()

  async list(spaceId: string, ideaId: string): Promise<Result<Attachment[]>> {
    if (this.failList) return err(this.failList)
    return ok(this.items.filter((a) => a.spaceId === spaceId && a.ideaId === ideaId))
  }

  async start(request: StartRequest) {
    this.started.push(request)
    if (this.failStart) return err(this.failStart)
    const attachmentId = `upload-${this.started.length}`
    this.pending.set(attachmentId, request)
    return ok({ attachmentId, uploadUrl: `https://storage.test/${attachmentId}` })
  }

  async finalize(attachmentId: string): Promise<Result<Attachment>> {
    const request = this.pending.get(attachmentId)
    if (this.failFinalize) return err(this.failFinalize)
    if (!request) return err(appError("not_found", "This upload could not be found"))
    const made = attachment(attachmentId, { ...request, uploaderId: "me" })
    this.items.push(made)
    return ok(made)
  }

  async signedUrl(id: string, disposition: Disposition) {
    this.urls.push({ id, disposition })
    return ok(`${this.signedBase}${id}?d=${disposition}`)
  }

  async remove(id: string): Promise<Result<void>> {
    this.removed.push(id)
    this.items = this.items.filter((a) => a.id !== id)
    return ok(undefined)
  }
}

/** Uploader that reports halfway progress, then waits for release() unless autoFinish. */
export class FakeUploader implements ObjectUploader {
  readonly puts: { url: string; mime: AttachmentMime; size: number }[] = []
  autoFinish = true
  failWith: AppError | null = null
  private waiting: (() => void)[] = []

  release(): void {
    for (const resume of this.waiting.splice(0)) resume()
  }

  async put({ url, file, mime, signal, onProgress }: PutRequest) {
    this.puts.push({ url, mime, size: file.size })
    onProgress?.(Math.floor(file.size / 2), file.size)
    if (!this.autoFinish)
      await new Promise<void>((resume) => {
        this.waiting.push(resume)
        signal?.addEventListener("abort", () => resume())
      })
    if (signal?.aborted) return err(appError("network", "Cancelled"))
    if (this.failWith) return err(this.failWith)
    onProgress?.(file.size, file.size)
    return ok(undefined)
  }
}
