import { createClient, type SupabaseClient, type SupportedStorage } from "@supabase/supabase-js"
import { bareOrigin } from "@/shared/domain"
import type { Database } from "./database.types"

export type Db = SupabaseClient<Database>

export function createSupabase(
  url = import.meta.env.VITE_SUPABASE_URL as string,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  storage?: SupportedStorage,
): Db {
  if (!url || !key)
    throw new Error("Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY")
  bareOrigin(url) // throws unless the URL is a bare http(s) origin
  return createClient<Database>(url, key, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      ...(storage ? { storage } : {}),
    },
  })
}
