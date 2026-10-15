import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { withRetry } from "./retry"
import { admin, stack, type TestUser } from "./stack"

/** A Supabase client signed in as one test user, for specs that drive the API directly. */
export async function signedInClient(user: TestUser): Promise<SupabaseClient> {
  const key = stack().PUBLISHABLE_KEY ?? stack().ANON_KEY!
  const client = createClient(stack().API_URL!, key, { auth: { persistSession: false } })
  await withRetry(async () => {
    const { error } = await client.auth.signInWithPassword(user)
    if (error) throw error
  })
  return client
}

/** Calls an RPC and returns its data, throwing on any error. */
export async function rpc<T>(client: SupabaseClient, fn: string, args: object): Promise<T> {
  const { data, error } = await client.rpc(fn, args)
  if (error) throw new Error(`${fn}: ${error.message}`)
  return data as T
}

/** Member user ids of a space, read past RLS with the admin client. */
export async function memberIds(spaceId: string): Promise<string[]> {
  const { data, error } = await admin()
    .from("space_members")
    .select("user_id")
    .eq("space_id", spaceId)
  if (error) throw error
  return (data as { user_id: string }[]).map((row) => row.user_id)
}

/**
 * Why a page served from `origin` cannot use an Edge Function, or null when it can: the
 * gateway answers its CORS preflight with 204 only when the function boots and allows the origin.
 */
export async function edgeFunctionBlocker(name: string, origin: string): Promise<string | null> {
  try {
    const reply = await fetch(`${stack().API_URL}/functions/v1/${name}`, {
      method: "OPTIONS",
      headers: { Origin: origin },
    })
    if (reply.status === 204) return null
    if (reply.status === 403) return `the ${name} function's ALLOWED_ORIGINS lacks ${origin}`
    return `the ${name} Edge Function is not serving (HTTP ${reply.status}: ${await reply.text()})`
  } catch (error) {
    return `the ${name} Edge Function is unreachable: ${String(error)}`
  }
}
