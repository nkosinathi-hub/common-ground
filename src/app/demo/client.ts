import { isolatedSupabase } from "@/shared/infrastructure/isolated-supabase"
import { demoUser } from "./identity"
import { demoFetch } from "./transport"

/** A session lives only in memory and is meaningful only to demoFetch. */
export function demoClient() {
  const expiry = Math.floor(Date.now() / 1000) + 86400
  const token = `demo.${btoa(JSON.stringify({ exp: expiry, sub: demoUser.id }))}.sample`
  const session = {
    access_token: token,
    refresh_token: "sample",
    expires_at: expiry,
    expires_in: 86400,
    token_type: "bearer",
    user: demoUser,
  }
  return isolatedSupabase("https://demo.invalid", demoFetch, session)
}
