import { appError, err, ok, type Result } from "@/shared/domain"
import { cancelled } from "../application/attachments-service"
import type { ObjectUploader, PutRequest } from "../application/ports"
import { formatBytes, BYTES_MAX } from "../domain/rules"

type Fetch = (input: string, init: RequestInit) => Promise<Response>

/**
 * PUTs the file to a Supabase Storage signed upload URL with fetch. Cancel by aborting the
 * signal. fetch exposes no upload progress, so progress is reported at start and at the end.
 */
export class FetchUploader implements ObjectUploader {
  constructor(private readonly send: Fetch = (input, init) => fetch(input, init)) {}

  async put({ url, file, mime, signal, onProgress }: PutRequest): Promise<Result<void>> {
    onProgress?.(0, file.size)
    try {
      const response = await this.send(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": mime, "x-upsert": "false" },
        signal,
      })
      if (!response.ok) return err(uploadError(response.status))
      onProgress?.(file.size, file.size)
      return ok(undefined)
    } catch {
      if (signal?.aborted) return cancelled()
      return err(appError("network", "The upload stopped. Check your connection and try again"))
    }
  }
}

function uploadError(status: number) {
  if (status === 413)
    return appError("validation", `Files can be at most ${formatBytes(BYTES_MAX)}`)
  if (status === 415 || status === 400)
    return appError("validation", "Only JPEG, PNG, WebP and PDF files can be attached")
  if (status === 401 || status === 403)
    return appError("denied", "The upload link expired. Try again")
  return appError("network", "The upload did not go through. Try again")
}
