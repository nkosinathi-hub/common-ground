import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

export type Db = SupabaseClient<Database>

const ORIGIN_ONLY =
  "VITE_SUPABASE_URL must be the project origin, e.g. https://<ref>.supabase.co, without a path such as /rest/v1/"

function isBareOrigin(url: string): boolean {
  const { protocol, pathname, search, hash } = new URL(url)
  return /^https?:$/.test(protocol) && pathname === "/" && !search && !hash
}

export function createSupabase(
  url = import.meta.env.VITE_SUPABASE_URL as string,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY as string,
): Db {
  if (!url || !key)
    throw new Error("Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY")
  if (!isBareOrigin(url)) throw new Error(ORIGIN_ONLY)
  return createClient<Database>(url, key, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}
