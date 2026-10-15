import { appError, err, type Result } from "@/shared/domain"
import { isWebUrl, precheckFile } from "../domain/rules"
import type { Attachment, FileLike, UploadProgress } from "../domain/types"
import type { AttachmentsGateway, Disposition, ObjectUploader } from "./ports"

/** One file for one idea. Aborting the signal cancels it before or during the PUT. */
export interface UploadRequest {
  readonly spaceId: string
  readonly ideaId: string
  readonly file: FileLike
  readonly signal?: AbortSignal
  readonly onProgress?: (progress: UploadProgress) => void
}

export const CANCELLED_MESSAGE = "Upload cancelled"

export const cancelled = () => err(appError("validation", CANCELLED_MESSAGE))

/** Attachment use cases: start, PUT to the signed URL, finalize; list, open and delete. */
export class AttachmentsService {
  constructor(
    private readonly gateway: AttachmentsGateway,
    private readonly uploader: ObjectUploader,
  ) {}

  list(spaceId: string, ideaId: string): Promise<Result<Attachment[]>> {
    return this.gateway.list(spaceId, ideaId)
  }

  async upload(upload: UploadRequest): Promise<Result<Attachment>> {
    const { spaceId, ideaId, file, signal, onProgress } = upload
    const mime = precheckFile(file)
    if (!mime.ok) return mime
    const total = file.size
    const report = (phase: UploadProgress["phase"], loaded: number) =>
      onProgress?.({ phase, loaded, total })
    report("starting", 0)
    const filename = file.name.trim()
    const request = { spaceId, ideaId, filename, mime: mime.value, bytes: total }
    const started = await this.gateway.start(request)
    if (!started.ok) return started
    if (signal?.aborted) return cancelled()
    report("uploading", 0)
    const put = await this.uploader.put({
      url: started.value.uploadUrl,
      file,
      mime: mime.value,
      signal,
      onProgress: (loaded) => report("uploading", loaded),
    })
    if (signal?.aborted) return cancelled()
    if (!put.ok) return put
    report("verifying", total)
    return this.gateway.finalize(started.value.attachmentId)
  }

  /** Only an http(s) URL is ever handed to an img src or a link, whatever the server sent. */
  async signedUrl(attachmentId: string, disposition: Disposition = "inline") {
    const url = await this.gateway.signedUrl(attachmentId, disposition)
    if (!url.ok || isWebUrl(url.value)) return url
    return err(appError("unknown", "This file could not be opened"))
  }

  remove(attachmentId: string): Promise<Result<void>> {
    return this.gateway.remove(attachmentId)
  }
}
