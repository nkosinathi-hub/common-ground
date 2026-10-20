import type { SupabaseClient } from "@supabase/supabase-js"
import type { ObjectStorage } from "../_shared/attachments/ports.ts"
import { fetchProbe } from "../_shared/attachments/probe.ts"
import { toPublicUrl } from "../_shared/attachments/public-url.ts"

const BUCKET = "attachments"
const PROBE_URL_SECONDS = 30

/**
 * The private attachments bucket through the service-role client. Never logs URLs or bytes. URLs
 * the browser receives use `publicOrigin` (see public-url.ts); the probe stays server-side.
 */
export function createObjectStorage(admin: SupabaseClient, publicOrigin: string): ObjectStorage {
  const bucket = () => admin.storage.from(BUCKET)

  return {
    async signedUploadUrl(path) {
      const { data, error } = await bucket().createSignedUploadUrl(path)
      if (error || !data) throw new Error("signed upload url failed")
      return toPublicUrl(data.signedUrl, publicOrigin)
    },

    async probe(path) {
      const { data, error } = await bucket().createSignedUrl(path, PROBE_URL_SECONDS)
      if (error || !data) return null
      return fetchProbe((url, init) => fetch(url, init), data.signedUrl)
    },

    async signedUrl(path, seconds, downloadAs) {
      const options = downloadAs ? { download: downloadAs } : undefined
      const { data, error } = await bucket().createSignedUrl(path, seconds, options)
      if (error || !data) throw new Error("signed url failed")
      return toPublicUrl(data.signedUrl, publicOrigin)
    },

    async remove(paths) {
      if (paths.length === 0) return
      const { error } = await bucket().remove([...paths])
      if (error) throw new Error("object removal failed")
    },
  }
}
