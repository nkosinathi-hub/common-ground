import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import { defaultClassify } from "../../domain/errors"
import { detectFormat } from "../../domain/format"
import type { ProviderPlugin } from "../../domain/plugin.types"
import { EMPTY_POLICY } from "../../domain/policy"
import type { PlayableSource, SourceKind } from "../../domain/source.types"
import { requestJson, requestOk } from "../http"

export interface FixtureOptions {
  /** Path on the fixture server answering `{ sources: [{ path | url, kind?, quality? }] }`. */
  readonly catalog: string
  /** Path the health probe asks; any 2xx is healthy. */
  readonly health?: string
}

interface Entry {
  readonly path?: string
  readonly url?: string
  readonly kind?: SourceKind
  readonly quality?: number
  readonly contentType?: string
}

function validate(raw: unknown): Result<FixtureOptions> {
  const options = raw as Partial<FixtureOptions> | null
  if (typeof options?.catalog !== "string" || !options.catalog.startsWith("/"))
    return err(appError("validation", "catalog must be a path such as /catalog"))
  return ok({ catalog: options.catalog, ...(options.health ? { health: options.health } : {}) })
}

/**
 * Test-only: serves the committed sample HLS, DASH and MP4 from a local fixture server. Never
 * listed in src/app/composition/playback.ts, so it is never in a build.
 */
export function fixturePlugin(origin: string, type = "fixture"): ProviderPlugin<FixtureOptions> {
  return {
    type,
    validateOptions: validate,
    capabilities: {
      media: ["movie", "episode"],
      sources: ["hls", "dash", "file"],
      credentials: false,
      health: true,
    },
    security: { ...EMPTY_POLICY, connect: [origin], media: [origin] },
    classifyError: defaultClassify,
    detectFormat,
    create: (options, deps) => ({
      id: deps.id,
      supports: () => true,
      resolve: async (_ref, signal) => {
        const reply = await requestJson(deps.fetch, { url: `${origin}${options.catalog}`, signal })
        if (!reply.ok) return reply
        const entries = (reply.value as { sources?: Entry[] }).sources ?? []
        return ok(
          entries.flatMap((e): PlayableSource[] => {
            const url = e.url ?? `${origin}${e.path ?? ""}`
            const kind = e.kind ?? detectFormat(url, e.contentType)
            if (!kind) return []
            const quality = e.quality === undefined ? {} : { quality: e.quality }
            return [{ kind, url, subtitles: [], segments: [], providerId: deps.id, ...quality }]
          }),
        )
      },
      health: (signal) =>
        requestOk(deps.fetch, { url: `${origin}${options.health ?? options.catalog}`, signal }),
    }),
  }
}
