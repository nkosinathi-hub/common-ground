export const parseOrigins = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)

/** CORS for an explicit allow list. A wildcard entry is ignored on purpose. */
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
  if (origin && origin !== "*" && allowed.includes(origin))
    headers["Access-Control-Allow-Origin"] = origin
  return headers
}

export const isOriginAllowed = (origin: string | null, allowed: readonly string[]): boolean =>
  origin === null || (origin !== "*" && allowed.includes(origin))

export function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
    },
  })
}

export function bearerToken(header: string | null): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(header ?? "")
  return match?.[1] ?? null
}
