export const parseOrigins = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)

/** True only for an origin on the explicit allow list. A wildcard entry is ignored on purpose. */
export const isOriginAllowed = (origin: string | null, allowed: readonly string[]): boolean =>
  origin !== null && origin !== "*" && allowed.includes(origin)

/** CORS for an explicit allow list: the origin is echoed only when it is allowed. */
export function corsHeaders(
  origin: string | null,
  allowed: readonly string[],
): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
  }
  if (origin && isOriginAllowed(origin, allowed)) headers["Access-Control-Allow-Origin"] = origin
  return headers
}
