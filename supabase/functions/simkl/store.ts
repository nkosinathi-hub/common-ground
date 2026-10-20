import type { SupabaseClient } from "@supabase/supabase-js"
import type { SimklStore } from "../_shared/simkl/ports.ts"

/** public.simkl_links through the service-role client, the only reader of the token. */
export function createSimklStore(admin: SupabaseClient): SimklStore {
  const links = () => admin.from("simkl_links")

  return {
    async link(userId) {
      const { data, error } = await links()
        .select("access_token, cursor")
        .eq("user_id", userId)
        .maybeSingle()
      if (error) throw new Error("simkl link lookup failed")
      if (!data) return null
      return { token: String(data.access_token), cursor: data.cursor ? String(data.cursor) : null }
    },

    async save(userId, token) {
      const row = {
        user_id: userId,
        access_token: token,
        cursor: null,
        connected_at: new Date().toISOString(),
        last_synced_at: null,
      }
      const { error } = await links().upsert(row, { onConflict: "user_id" })
      if (error) throw new Error("simkl link write failed")
    },

    async importWatches(userId, watches, cursor) {
      const { data, error } = await admin.rpc("import_simkl_watches", {
        target_user: userId,
        watches,
        new_cursor: cursor,
      })
      if (error) throw new Error("simkl import failed")
      return Number(data ?? 0)
    },

    async remove(userId) {
      const { error } = await links().delete().eq("user_id", userId)
      if (error) throw new Error("simkl link removal failed")
    },
  }
}
