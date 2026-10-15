import type { AppError } from "@/shared/domain"
import type { AttachmentsService } from "../application/attachments-service"
import { precheckFile } from "../domain/rules"
import type { Attachment, FileLike, UploadProgress } from "../domain/types"

/** Which idea uploads go to; read at upload time so it follows prop changes. */
export interface UploadTarget {
  readonly spaceId: string
  readonly ideaId: string
}

/** One upload at a time: precheck, progress, cancel and the last error. */
export class UploadState {
  filename = $state<string | null>(null)
  progress = $state<UploadProgress | null>(null)
  error = $state<AppError | null>(null)
  busy = $state(false)
  private controller: AbortController | null = null

  constructor(
    private readonly service: AttachmentsService,
    private readonly target: () => UploadTarget,
    private readonly onDone: (attachment: Attachment) => void,
  ) {}

  /** Share of bytes sent, or null while starting (no byte count yet). */
  get percent(): number | null {
    const p = this.progress
    if (!p || p.phase === "starting" || p.total === 0) return null
    return Math.round((p.loaded / p.total) * 100)
  }

  async upload(file: FileLike): Promise<void> {
    if (this.busy) return
    this.error = null
    const precheck = precheckFile(file)
    if (!precheck.ok) {
      this.error = precheck.error
      return
    }
    const controller = new AbortController()
    this.controller = controller
    this.busy = true
    this.filename = file.name
    const result = await this.service.upload({
      ...this.target(),
      file,
      signal: controller.signal,
      onProgress: (progress) => (this.progress = progress),
    })
    this.controller = null
    this.busy = false
    this.progress = null
    this.filename = null
    if (result.ok) this.onDone(result.value)
    // A cancelled upload is what the person asked for, so it is not shown as an error.
    else if (!controller.signal.aborted) this.error = result.error
  }

  cancel(): void {
    this.controller?.abort()
  }
}
