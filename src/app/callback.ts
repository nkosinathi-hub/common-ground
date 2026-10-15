import { parseAuthCallback, scrubbedUrl, type AuthService } from "@/features/auth"

export type CallbackOutcome = "none" | "signed-in" | "new-password" | "expired"

/** Handles Supabase email links before hash routing, then removes tokens from the URL. */
export async function handleAuthCallback(auth: AuthService): Promise<CallbackOutcome> {
  const callback = parseAuthCallback(location.search, location.hash)
  if (callback.kind === "none") return "none"
  const clean = scrubbedUrl(location.pathname, callback.kind === "error" ? "" : location.hash)
  history.replaceState(null, "", clean)
  if (callback.kind === "error") return "expired"
  const exchanged = await auth.exchangeCode(callback.code)
  if (!exchanged.ok) return "expired"
  return callback.next === "new-password" ? "new-password" : "signed-in"
}
