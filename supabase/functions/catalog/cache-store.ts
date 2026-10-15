import type { SupabaseClient } from "npm:@supabase/supabase-js@2"
import type { CacheEntry, CacheStore } from "../_shared/catalog/cache.ts"

/** public.catalog_cache through the service-role client (the table has no policies). */
export function createCacheStore(admin: SupabaseClient): CacheStore {
  const table = () => admin.from("catalog_cache")

  return {
    async get(key) {
      const { data, error } = await table()
        .select("response, fetched_at, expires_at")
        .eq("cache_key", key)
        .maybeSingle()
      if (error || !data) return null
      const entry: CacheEntry = {
        response: data.response,
        fetchedAt: String(data.fetched_at),
        expiresAt: String(data.expires_at),
      }
      return entry
    },

    async put({ key, response, fetchedAt, expiresAt }) {
      const row = {
        cache_key: key,
        response,
        fetched_at: fetchedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      }
      const { error } = await table().upsert(row, { onConflict: "cache_key" })
      if (error) throw new Error("cache write failed")
    },

    async expire(key, at) {
      const { error } = await table().update({ expires_at: at.toISOString() }).eq("cache_key", key)
      if (error) throw new Error("cache expire failed")
    },
  }
}
