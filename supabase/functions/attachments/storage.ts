import type { SupabaseClient } from "npm:@supabase/supabase-js@2"
import { PROBE_BYTES } from "../_shared/attachments/magic.ts"
import type { ObjectStorage } from "../_shared/attachments/ports.ts"
import { readProbe } from "../_shared/attachments/probe.ts"

const BUCKET = "attachments"
const PROBE_URL_SECONDS = 30

/** The private attachments bucket through the service-role client. Never logs URLs or bytes. */
export function createObjectStorage(admin: SupabaseClient): ObjectStorage {
  const bucket = () => admin.storage.from(BUCKET)

  return {
    async signedUploadUrl(path) {
      const { data, error } = await bucket().createSignedUploadUrl(path)
      if (error || !data) throw new Error("signed upload url failed")
      return data.signedUrl
    },

    async probe(path) {
      const { data, error } = await bucket().createSignedUrl(path, PROBE_URL_SECONDS)
      if (error || !data) return null
      const response = await fetch(data.signedUrl, {
        headers: { Range: `bytes=0-${PROBE_BYTES - 1}` },
      })
      const body = new Uint8Array(await response.arrayBuffer())
      return readProbe(
        {
          status: response.status,
          contentRange: response.headers.get("content-range"),
          contentLength: response.headers.get("content-length"),
          body,
        },
        PROBE_BYTES,
      )
    },

    async signedUrl(path, seconds, downloadAs) {
      const options = downloadAs ? { download: downloadAs } : undefined
      const { data, error } = await bucket().createSignedUrl(path, seconds, options)
      if (error || !data) throw new Error("signed url failed")
      return data.signedUrl
    },

    async remove(paths) {
      if (paths.length === 0) return
      const { error } = await bucket().remove([...paths])
      if (error) throw new Error("object removal failed")
    },
  }
}
