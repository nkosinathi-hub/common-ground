/** One rule for VITE_SUPABASE_URL, shared by the client and the build's Content Security Policy. */
export const ORIGIN_ONLY =
  "VITE_SUPABASE_URL must be the project origin, e.g. https://<ref>.supabase.co, without a path such as /rest/v1/"

/** Parses the Supabase URL and insists on a bare http(s) origin. */
export function bareOrigin(supabaseUrl: string): URL {
  let url: URL
  try {
    url = new URL(supabaseUrl)
  } catch {
    throw new Error("Common Ground needs a valid VITE_SUPABASE_URL")
  }
  const web = url.protocol === "https:" || url.protocol === "http:"
  if (!web || url.pathname !== "/" || url.search || url.hash) throw new Error(ORIGIN_ONLY)
  return url
}
