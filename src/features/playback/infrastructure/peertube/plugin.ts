import { appError, err, ok } from "../../../../shared/domain/result"
import { defaultClassify } from "../../domain/errors"
import { checkPattern } from "../../domain/origin-policy"
import type { ProviderPlugin } from "../../domain/plugin.types"
import { requestOk } from "../http"
import { findTitle, validatePeerTubeOptions, type PeerTubeOptions } from "./titles"
import { captions, openVideo, toSources } from "./video"

/** One PeerTube instance, fixed at build time so the CSP and this policy agree. */
export interface PeerTubeInstance {
  readonly origin: string
  /** Extra origins its files and playlists are served from, when storage sits on a CDN. */
  readonly media?: readonly string[]
}

/**
 * Openly licensed films and episodes from one PeerTube instance, through a curated list of
 * TMDB titles. No credentials: every video it plays is public and Creative Commons.
 */
export function peertubePlugin(
  instance: PeerTubeInstance,
  type = "peertube",
): ProviderPlugin<PeerTubeOptions> {
  const origin = instance.origin.replace(/\/+$/, "")
  if (checkPattern(origin, { allowLoopback: true }) || origin.includes("*"))
    throw new Error(`PeerTube instance "${instance.origin}" must be one exact https origin`)
  return {
    type,
    validateOptions: validatePeerTubeOptions,
    capabilities: {
      media: ["movie", "episode"],
      sources: ["hls", "file", "embed"],
      credentials: false,
      health: true,
    },
    security: {
      connect: [origin],
      media: [origin, ...(instance.media ?? [])],
      frames: [origin],
      subtitles: [origin],
      sandbox: ["allow-scripts", "allow-same-origin", "allow-presentation"],
    },
    classifyError: defaultClassify,
    create: (options, deps) => ({
      id: deps.id,
      supports: (ref) => findTitle(options.titles, ref) !== undefined,
      resolve: async (ref, signal) => {
        const title = findTitle(options.titles, ref)
        if (!title) return err(appError("not_found", "Not in this instance's catalog"))
        const curated = title.licence !== undefined
        const video = await openVideo(deps.fetch, origin, title.video, curated, signal)
        if (!video.ok) return video
        const tracks = await captions(deps.fetch, origin, title.video, signal)
        return ok(toSources(video.value, tracks, origin, deps.id))
      },
      health: (signal) => requestOk(deps.fetch, { url: `${origin}/api/v1/config`, signal }),
    }),
  }
}
