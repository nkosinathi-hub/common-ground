import { appError, err, type Result } from "@/shared/domain"
import { precheckFile } from "../domain/rules"
import type { Attachment, FileLike, UploadProgress } from "../domain/types"
import type { AttachmentsGateway, Disposition, ObjectUploader } from "./ports"

export const CANCELLED_MESSAGE = "Upload cancelled"

export interface UploadOptions {
  readonly signal?: AbortSignal
  readonly onProgress?: (progress: UploadProgress) => void
}

const cancelled = () => err(appError("validation", CANCELLED_MESSAGE))

/** Attachment use cases: start, PUT to the signed URL, finalize; list, open and delete. */
export class AttachmentsService {
  constructor(
    private readonly gateway: AttachmentsGateway,
    private readonly uploader: ObjectUploader,
  ) {}

  list(spaceId: string, ideaId: string): Promise<Result<Attachment[]>> {
    return this.gateway.list(spaceId, ideaId)
  }

  async upload(
    spaceId: string,
    ideaId: string,
    file: FileLike,
    { signal, onProgress }: UploadOptions = {},
  ): Promise<Result<Attachment>> {
    const mime = precheckFile(file)
    if (!mime.ok) return mime
    const total = file.size
    const report = (phase: UploadProgress["phase"], loaded: number) =>
      onProgress?.({ phase, loaded, total })
    report("starting", 0)
    const started = await this.gateway.start({
      spaceId,
      ideaId,
      filename: file.name.trim(),
      mime: mime.value,
      bytes: total,
    })
    if (!started.ok) return started
    if (signal?.aborted) return cancelled()
    report("uploading", 0)
    const put = await this.uploader.put(started.value.uploadUrl, file, mime.value, {
      signal,
      onProgress: (loaded) => report("uploading", loaded),
    })
    if (signal?.aborted) return cancelled()
    if (!put.ok) return put
    report("verifying", total)
    return this.gateway.finalize(started.value.attachmentId)
  }

  signedUrl(attachmentId: string, disposition: Disposition = "inline"): Promise<Result<string>> {
    return this.gateway.signedUrl(attachmentId, disposition)
  }

  remove(attachmentId: string): Promise<Result<void>> {
    return this.gateway.remove(attachmentId)
  }
}
