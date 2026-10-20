import { appError, err, ok, type Result } from "../../../shared/domain/result"
import { checkPattern, type PolicyRules } from "./origin-policy"
import type { SandboxToken, SecurityPolicy } from "./plugin.types"

export const EMPTY_POLICY: SecurityPolicy = {
  connect: [],
  media: [],
  frames: [],
  subtitles: [],
  sandbox: [],
}

const DIRECTIVES = ["connect", "media", "frames", "subtitles"] as const

/** No allow-top-navigation of any kind, no escaping the sandbox, no forms or modals. */
const SANDBOX = new Set<SandboxToken>([
  "allow-scripts",
  "allow-same-origin",
  "allow-presentation",
  "allow-popups",
])

const invalid = (field: string, message: string) => err(appError("validation", message, field))

/** Checks every declared origin and sandbox token; the error names the directive. */
export function validatePolicy(
  policy: SecurityPolicy,
  rules: PolicyRules = {},
): Result<SecurityPolicy> {
  if (typeof policy !== "object" || policy === null) return invalid("policy", "No policy")
  for (const directive of DIRECTIVES) {
    const origins: unknown = policy[directive]
    if (!Array.isArray(origins)) return invalid(directive, `${directive} must be a list`)
    for (const origin of origins as unknown[]) {
      const reason = typeof origin === "string" ? checkPattern(origin, rules) : "not a string"
      if (reason) return invalid(directive, `${directive} "${String(origin)}": ${reason}`)
    }
  }
  const tokens: unknown = policy.sandbox
  if (!Array.isArray(tokens)) return invalid("sandbox", "sandbox must be a list")
  const bad = (tokens as unknown[]).find((t) => !SANDBOX.has(t as SandboxToken))
  if (bad !== undefined)
    return invalid("sandbox", `sandbox token ${JSON.stringify(bad)} is refused`)
  return ok(policy)
}
