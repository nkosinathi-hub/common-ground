import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

/** Literal markers of a server-side key. The publishable `sb_publishable_` key is allowed. */
const FORBIDDEN = [/sb_secret_[A-Za-z0-9_-]+/, /"role"\s*:\s*"service_role"/, /service_role/]
const JWT = /eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g

function claims(segment: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(segment, "base64url").toString("utf8"))
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** A Supabase service-role key, or a TMDB v4 read access token (32-hex `aud` plus `scopes`). */
function secretJwt(payload: Record<string, unknown>): string | null {
  if (payload.role === "service_role") return "service-role JWT"
  const tmdb = typeof payload.aud === "string" && /^[0-9a-f]{32}$/.test(payload.aud)
  return tmdb && Array.isArray(payload.scopes) ? "TMDB access token" : null
}

/** Reasons the text holds a server-side secret; empty when it is safe to ship. */
export function findSecrets(text: string, values: readonly string[]): string[] {
  const found = FORBIDDEN.filter((rule) => rule.test(text)).map((rule) => `marker ${rule.source}`)
  for (const match of text.matchAll(JWT)) {
    const payload = claims(match[1] ?? "")
    const reason = payload && secretJwt(payload)
    if (reason) found.push(reason)
  }
  if (values.some((v) => text.includes(v))) found.push("functions env value")
  return found
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

/** Paths under dir whose contents hold a server-side secret. */
export function scanDir(dir: string, values: readonly string[]): string[] {
  return walk(dir).filter((path) => findSecrets(readFileSync(path, "utf8"), values).length > 0)
}
