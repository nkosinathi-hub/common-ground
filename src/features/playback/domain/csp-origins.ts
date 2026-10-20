import type { SecurityPolicy } from "./plugin.types"
import type { PolicyRules } from "./origin-policy"
import { validatePolicy } from "./policy"

export interface CspOrigins {
  readonly connect: string[]
  readonly media: string[]
  readonly frames: string[]
}

const unique = (lists: readonly (readonly string[])[]) => [...new Set(lists.flat())]

/**
 * The origins the build's CSP grants playback, from the plugins compiled in. Shaka fetches
 * segments and text tracks, so media and subtitle origins are also connect origins. A plugin
 * with an invalid policy throws, which fails the build. `rules.allowLoopback` is for the
 * end-to-end build's local media server only (src/app/composition/playback-fixture.ts).
 */
export function cspOrigins(
  plugins: readonly { readonly type: string; readonly security: SecurityPolicy }[],
  rules: PolicyRules = {},
): CspOrigins {
  for (const plugin of plugins) {
    const checked = validatePolicy(plugin.security, rules)
    if (!checked.ok) throw new Error(`playback plugin ${plugin.type}: ${checked.error.message}`)
  }
  const all = (pick: (p: SecurityPolicy) => readonly string[]) =>
    plugins.map((plugin) => pick(plugin.security))
  return {
    connect: unique([...all((p) => p.connect), ...all((p) => p.media), ...all((p) => p.subtitles)]),
    media: unique([...all((p) => p.media), ...all((p) => p.subtitles)]),
    frames: unique(all((p) => p.frames)),
  }
}
