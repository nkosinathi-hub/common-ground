/**
 * Origin patterns a plugin may declare: an exact https origin, or `https://*.<domain>` matching
 * exactly one subdomain label. Never a bare `*`, never http, never a script-capable scheme.
 */
export interface PolicyRules {
  /** Tests only: accept http://127.0.0.1:<port> and http://localhost:<port>. */
  readonly allowLoopback?: boolean
}

const SCRIPTING = /^(javascript|data|blob|filesystem|vbscript):/i
const PATTERN = /^(https?):\/\/((?:\*\.)?)((?:[a-z0-9-]+\.)*[a-z0-9-]+)(:\d{1,5})?$/i
const LOOPBACK = /^http:\/\/(127\.0\.0\.1|localhost)(:\d{1,5})?$/i

/** Null when the pattern is acceptable, otherwise the reason. */
export function checkPattern(pattern: string, rules: PolicyRules = {}): string | null {
  if (pattern.startsWith("'")) return "a CSP keyword is not an origin"
  if (SCRIPTING.test(pattern)) return "a script-capable scheme is never allowed"
  if (pattern.includes("*") && !/^https?:\/\/\*\.[^*]+$/.test(pattern))
    return "a wildcard may only be the first label, e.g. https://*.example.org"
  const match = PATTERN.exec(pattern)
  if (!match) return "must be a bare origin such as https://example.org"
  if (match[1]?.toLowerCase() !== "https") {
    return rules.allowLoopback && LOOPBACK.test(pattern) ? null : "must be https"
  }
  if (match[2] && (match[3] ?? "").split(".").length < 2)
    return "a wildcard needs a registrable domain under it, e.g. https://*.example.org"
  return null
}

function parse(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

/** Whether a URL's origin is the pattern's origin, or one label under its wildcard. */
export function matchesOrigin(url: string, pattern: string): boolean {
  const target = parse(url)
  if (!target || (target.protocol !== "https:" && target.protocol !== "http:")) return false
  const wild = pattern.includes("://*.")
  const base = parse(wild ? pattern.replace("://*.", "://") : pattern)
  if (!base || base.protocol !== target.protocol || base.port !== target.port) return false
  if (!wild) return base.hostname === target.hostname
  const suffix = `.${base.hostname}`
  if (!target.hostname.endsWith(suffix)) return false
  const label = target.hostname.slice(0, -suffix.length)
  return label.length > 0 && !label.includes(".")
}

export function matchesAny(url: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => matchesOrigin(url, pattern))
}
