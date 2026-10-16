import { err, ok, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type { Db } from "@/shared/infrastructure/supabase"

const BUCKET = "space-media"

interface StorageFailure {
  readonly message?: string
  readonly status?: number
  readonly statusCode?: string
}

/** Storage errors carry an HTTP status (sometimes as a string) rather than a Postgres code. */
const failure = (error: StorageFailure) => {
  const status = Number(error.status ?? error.statusCode)
  return err(toAppError({ message: error.message, ...(status ? { status } : {}) }))
}

/** The private space-media bucket: members read through signed URLs, the owner writes. */
export class SupabaseSpaceMedia {
  constructor(private readonly db: Db) {}

  private bucket = () => this.db.storage.from(BUCKET)

  async upload(path: string, file: Blob): Promise<Result<void>> {
    const { error } = await this.bucket().upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
    return error ? failure(error) : ok(undefined)
  }

  async remove(paths: readonly string[]): Promise<Result<void>> {
    if (paths.length === 0) return ok(undefined)
    const { error } = await this.bucket().remove([...paths])
    return error ? failure(error) : ok(undefined)
  }

  async sign(paths: readonly string[], seconds: number): Promise<Result<Record<string, string>>> {
    if (paths.length === 0) return ok({})
    const { data, error } = await this.bucket().createSignedUrls([...paths], seconds)
    if (error) return failure(error)
    const signed = (data ?? []).flatMap((entry) =>
      entry.path && entry.signedUrl && !entry.error ? [[entry.path, entry.signedUrl] as const] : [],
    )
    return ok(Object.fromEntries(signed))
  }
}
