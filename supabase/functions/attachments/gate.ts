import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2"
import { RATE_LIMIT, type AttachmentsGate } from "../_shared/attachments/ports.ts"

const NO_SESSION = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }

export const adminClient = (url: string, serviceRoleKey: string): SupabaseClient =>
  createClient(url, serviceRoleKey, { auth: NO_SESSION })

/** Supabase-backed caller checks. Errors are rethrown without detail so nothing leaks to logs. */
export function createGate(url: string, anonKey: string, admin: SupabaseClient): AttachmentsGate {
  const asCaller = (token: string) =>
    createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: NO_SESSION,
    })

  return {
    async userFor(token) {
      const { data, error } = await admin.auth.getUser(token)
      return error || !data.user ? null : data.user.id
    },

    async isMember(token, spaceId) {
      const { data, error } = await asCaller(token).rpc("is_space_member", {
        target_space: spaceId,
      })
      if (error) throw new Error("membership check failed")
      return data === true
    },

    async consume(userId) {
      const { data, error } = await admin.rpc("consume_rate_limit", {
        target_user: userId,
        bucket_name: RATE_LIMIT.bucket,
        max_requests: RATE_LIMIT.max,
        window_seconds: RATE_LIMIT.windowSeconds,
      })
      if (error) throw new Error("rate limit check failed")
      return data === true
    },
  }
}
