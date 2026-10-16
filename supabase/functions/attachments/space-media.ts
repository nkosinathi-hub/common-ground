import type { SupabaseClient } from "npm:@supabase/supabase-js@2"
import type { MediaBucket, MediaCandidates } from "../_shared/attachments/cleanup-media.ts"

const BUCKET = "space-media"

/** Orphaned space pictures: listed by SQL, removed through the Storage API (service role). */
export function createSpaceMedia(admin: SupabaseClient): {
  candidates: MediaCandidates
  bucket: MediaBucket
} {
  return {
    candidates: {
      async list() {
        const { data, error } = await admin.rpc("space_media_cleanup_candidates")
        if (error) throw new Error("media listing failed")
        return ((data ?? []) as { object_path: string }[]).map((row) => String(row.object_path))
      },
    },
    bucket: {
      async remove(paths) {
        if (paths.length === 0) return
        const { error } = await admin.storage.from(BUCKET).remove([...paths])
        if (error) throw new Error("media removal failed")
      },
    },
  }
}
