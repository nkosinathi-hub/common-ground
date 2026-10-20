import { ok } from "../../../shared/domain/result"
import { defaultClassify } from "../domain/errors"
import type { ProviderPlugin } from "../domain/plugin.types"
import { EMPTY_POLICY } from "../domain/policy"
import type { ProviderConfig } from "../domain/provider.types"

/** A plugin the core has never heard of: it exists only in tests and serves one DASH file. */
export const mirrorPlugin = (origin: string): ProviderPlugin<{ path: string }> => ({
  type: "community-mirror",
  validateOptions: (raw) => ok({ path: String((raw as { path?: string }).path) }),
  capabilities: { media: ["movie"], sources: ["dash"], credentials: false, health: false },
  security: { ...EMPTY_POLICY, connect: [origin], media: [origin] },
  classifyError: defaultClassify,
  create: (options, deps) => ({
    id: deps.id,
    supports: (ref) => ref.kind === "movie",
    resolve: async () =>
      ok([
        {
          ...{ kind: "dash", url: `${origin}${options.path}` },
          ...{ subtitles: [], segments: [], providerId: deps.id },
        },
      ]),
    health: async () => ok(undefined),
  }),
})

const entry = (
  type: string,
  id: string,
  priority: number,
  timeoutMs: number,
  options: unknown,
) => ({
  ...{ type, id, enabled: true, priority, timeoutMs, retries: 0, options },
})

/** Config as it would come from device storage: plain JSON, parsed. */
export const storedConfigs = (firstCatalog: string): ProviderConfig[] =>
  JSON.parse(
    JSON.stringify([
      entry("fixture", "fixture", 1, 200, { catalog: firstCatalog }),
      entry("community-mirror", "mirror", 5, 1000, { path: "/media/dash/manifest.mpd" }),
    ]),
  ) as ProviderConfig[]
