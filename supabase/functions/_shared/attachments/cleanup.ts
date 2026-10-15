import type { AttachmentsStore, CleanupCandidate, ObjectStorage } from "./ports.ts"

const CLEANUP_BATCH = 100

interface CleanupBatch {
  readonly paths: readonly string[]
  readonly attachmentIds: readonly string[]
}

interface CleanupReport {
  readonly removedObjects: number
  readonly deletedRows: number
  readonly failedBatches: number
}

/** Groups candidates into batches; orphaned objects (no row) only remove the object. */
export function planCleanup(
  candidates: readonly CleanupCandidate[],
  size = CLEANUP_BATCH,
): CleanupBatch[] {
  const unique = [...new Map(candidates.map((c) => [c.objectPath, c])).values()]
  const batches: CleanupBatch[] = []
  for (let start = 0; start < unique.length; start += size) {
    const slice = unique.slice(start, start + size)
    batches.push({
      paths: slice.map((c) => c.objectPath),
      attachmentIds: slice.flatMap((c) => (c.attachmentId ? [c.attachmentId] : [])),
    })
  }
  return batches
}

/**
 * Removes objects first and their rows only after, so a failure leaves the row in place
 * and the next run retries it. Removing an object that is already gone is not an error.
 */
export async function runCleanup(
  store: AttachmentsStore,
  storage: ObjectStorage,
): Promise<CleanupReport> {
  let removedObjects = 0
  let deletedRows = 0
  let failedBatches = 0
  for (const batch of planCleanup(await store.cleanupCandidates())) {
    try {
      await storage.remove(batch.paths)
      removedObjects += batch.paths.length
      if (batch.attachmentIds.length > 0) await store.deleteRows(batch.attachmentIds)
      deletedRows += batch.attachmentIds.length
    } catch {
      failedBatches += 1
    }
  }
  return { removedObjects, deletedRows, failedBatches }
}
