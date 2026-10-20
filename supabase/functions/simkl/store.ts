import type { SupabaseClient } from "@supabase/supabase-js"
import type { SimklStore } from "../_shared/simkl/ports.ts"

const COLUMNS =
  "access_token, refresh_token, access_expires_at, device_code, device_expires_at, cursor"

const textOrNull = (value: unknown) => (typeof value === "string" ? value : null)

/** public.simkl_links through the service-role client, the only reader of tokens and codes. */
export function createSimklStore(admin: SupabaseClient): SimklStore {
  const links = () => admin.from("simkl_links")
  const update = async (userId: string, values: Record<string, unknown>) => {
    const { error } = await links().update(values).eq("user_id", userId)
    if (error) throw new Error("simkl link write failed")
  }

  return {
    async link(userId) {
      const { data, error } = await links().select(COLUMNS).eq("user_id", userId).maybeSingle()
      if (error) throw new Error("simkl link lookup failed")
      if (!data) return null
      const row = data as Record<string, unknown>
      return {
        accessToken: textOrNull(row.access_token),
        refreshToken: textOrNull(row.refresh_token),
        accessExpiresAt: textOrNull(row.access_expires_at),
        deviceCode: textOrNull(row.device_code),
        deviceExpiresAt: textOrNull(row.device_expires_at),
        cursor: textOrNull(row.cursor),
      }
    },

    async startDevice(userId, deviceCode, expiresAt) {
      const row = { user_id: userId, device_code: deviceCode, device_expires_at: expiresAt }
      const { error } = await links().upsert(row, { onConflict: "user_id" })
      if (error) throw new Error("simkl device write failed")
    },

    clearDevice: (userId) => update(userId, { device_code: null, device_expires_at: null }),

    saveTokens: (userId, tokens, connect) =>
      update(userId, {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        access_expires_at: tokens.accessExpiresAt,
        device_code: null,
        device_expires_at: null,
        refresh_lease_until: null,
        ...(connect ? { connected_at: new Date().toISOString() } : {}),
      }),

    async claimRefresh(userId) {
      const { data, error } = await admin.rpc("claim_simkl_refresh", { target_user: userId })
      if (error) throw new Error("simkl refresh lease failed")
      return data === true
    },

    releaseRefresh: (userId) => update(userId, { refresh_lease_until: null }),

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
