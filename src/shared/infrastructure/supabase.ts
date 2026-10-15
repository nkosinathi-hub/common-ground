import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

export type Db = SupabaseClient<Database>

export function createSupabase(
  url = import.meta.env.VITE_SUPABASE_URL as string,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY as string,
): Db {
  if (!url || !key) throw new Error("Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY")
  return createClient<Database>(url, key, {
    auth: { flowType: "pkce", detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
  })
}
