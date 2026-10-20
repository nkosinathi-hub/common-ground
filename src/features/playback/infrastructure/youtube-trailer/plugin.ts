import { appError, err, ok } from "../../../../shared/domain/result"
import { defaultClassify } from "../../domain/errors"
import type { ProviderPlugin, Trailer } from "../../domain/plugin.types"
import { EMPTY_POLICY } from "../../domain/policy"
import type { PlayableSource } from "../../domain/source.types"

const FRAME = "https://www.youtube-nocookie.com"
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

const official = (v: Trailer) =>
  v.site === "YouTube" && v.type === "Trailer" && v.official && VIDEO_ID.test(v.key)

/**
 * Official trailers listed by TMDB (site YouTube, type Trailer), embedded from YouTube's
 * privacy-enhanced domain. The TMDB call goes through the catalog's TmdbLookup port.
 */
export const youtubeTrailerPlugin: ProviderPlugin<null> = {
  type: "youtube-trailer",
  validateOptions: () => ok(null),
  capabilities: {
    media: ["movie", "episode"],
    sources: ["embed"],
    credentials: false,
    health: false,
  },
  security: {
    ...EMPTY_POLICY,
    frames: [FRAME],
    sandbox: ["allow-scripts", "allow-same-origin", "allow-presentation", "allow-popups"],
  },
  classifyError: defaultClassify,
  create: (_options, deps) => ({
    id: deps.id,
    supports: () => true,
    resolve: async (ref, signal) => {
      const videos = await deps.tmdb.videos(ref, signal)
      if (!videos.ok) return videos
      const sources = videos.value.filter(official).map((v): PlayableSource => ({
        kind: "embed",
        url: `${FRAME}/embed/${v.key}`,
        subtitles: [],
        segments: [],
        providerId: deps.id,
      }))
      return sources.length ? ok(sources) : err(appError("not_found", "No official trailer"))
    },
    health: async () => ok(undefined),
  }),
}
