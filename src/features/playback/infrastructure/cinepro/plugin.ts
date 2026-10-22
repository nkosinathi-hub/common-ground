import { appError, err, ok, type Result } from "../../../../shared/domain/result"
import { defaultClassify } from "../../domain/errors"
import { checkPattern } from "../../domain/origin-policy"
import type { ProviderPlugin } from "../../domain/plugin.types"
import { EMPTY_POLICY } from "../../domain/policy"
import type { MediaRef } from "../../domain/media-ref"
import type { PlayableSource } from "../../domain/source.types"
import { requestJson } from "../http"
import { toPlayableSources } from "./response"

export interface CineProOptions {
  readonly serverUrl: string
}

const bare = (value: string) => value.replace(/\/+$/, "")

function validate(origin: string, raw: unknown): Result<CineProOptions> {
  const serverUrl = (raw as Partial<CineProOptions> | null)?.serverUrl
  if (typeof serverUrl !== "string" || bare(serverUrl) !== origin)
    return err(
      appError("validation", `CinePro Core must be ${origin}, the server this build allows`),
    )
  return ok({ serverUrl: origin })
}

function endpoint(ref: MediaRef, origin: string): string {
  const id = encodeURIComponent(String(ref.tmdbId))
  if (ref.kind === "movie") return `${origin}/v1/movies/${id}`
  return `${origin}/v1/tv/${id}/seasons/${ref.season}/episodes/${ref.episode}`
}

async function resolve(
  fetcher: typeof fetch,
  origin: string,
  providerId: string,
  ref: MediaRef,
  signal: AbortSignal,
): Promise<Result<PlayableSource[]>> {
  const result = await requestJson(fetcher, { url: endpoint(ref, origin), signal })
  if (!result.ok) return result
  const sources = toPlayableSources(result.value, origin, providerId)
  return sources.length
    ? ok(sources)
    : err(appError("not_found", "CinePro Core returned no supported playable sources"))
}

/** Optional self-hosted CinePro Core adapter. Its origin is fixed at build time. */
export function cineproPlugin(
  origin: string,
  options: { readonly allowLoopback?: boolean } = {},
): ProviderPlugin<CineProOptions> {
  const server = bare(origin)
  const reason = checkPattern(server, { allowLoopback: options.allowLoopback })
  if (reason || server.includes("*"))
    throw new Error(`VITE_CINEPRO_CORE_ORIGIN "${origin}" ${reason ?? "must be an exact origin"}`)
  return {
    type: "cinepro",
    validateOptions: (raw) => validate(server, raw),
    capabilities: {
      media: ["movie", "episode"],
      sources: ["hls", "dash", "file", "embed"],
      credentials: false,
      health: true,
    },
    security: {
      ...EMPTY_POLICY,
      connect: [server],
      media: [server],
      frames: [server],
      subtitles: [server],
      sandbox: ["allow-scripts", "allow-same-origin", "allow-presentation"],
    },
    classifyError: defaultClassify,
    create: (config, deps) => ({
      id: deps.id,
      supports: () => true,
      resolve: (ref, signal) => resolve(deps.fetch, config.serverUrl, deps.id, ref, signal),
      health: async (signal) => {
        const result = await requestJson(deps.fetch, { url: `${config.serverUrl}/`, signal })
        return result.ok ? ok(undefined) : result
      },
    }),
  }
}
