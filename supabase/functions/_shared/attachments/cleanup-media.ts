const MEDIA_BATCH = 100

/** public.space_media_cleanup_candidates(): space-media objects no space points at any more. */
export interface MediaCandidates {
  list(): Promise<string[]>
}

/** The private space-media bucket through the service-role client. */
export interface MediaBucket {
  remove(paths: readonly string[]): Promise<void>
}

export interface MediaCleanupReport {
  readonly removedObjects: number
  readonly failedBatches: number
}

/**
 * Removes replaced, abandoned and deleted-space pictures. There are no rows to delete: the SQL
 * only lists objects older than an hour that neither avatar_path nor cover_path names.
 */
export async function runMediaCleanup(
  candidates: MediaCandidates,
  bucket: MediaBucket,
  size = MEDIA_BATCH,
): Promise<MediaCleanupReport> {
  const paths = [...new Set(await candidates.list())]
  let removedObjects = 0
  let failedBatches = 0
  for (let start = 0; start < paths.length; start += size) {
    const batch = paths.slice(start, start + size)
    try {
      await bucket.remove(batch)
      removedObjects += batch.length
    } catch {
      failedBatches += 1
    }
  }
  return { removedObjects, failedBatches }
}
