import { PlaybackService } from "@/features/playback"
import { ok } from "@/shared/domain"
import type { MediaRef } from "@/features/playback/domain/media-ref"
import { MemoryPlaybackLog } from "@/features/playback/infrastructure/memory-log"
import type { PlaybackFeature } from "../composition/playback-feature"

/** The real player and controls, with a clearly labelled local clip rather than scraped media. */
export function demoPlayback(device: PlaybackFeature["device"]): PlaybackFeature {
  const source = {
    kind: "file" as const,
    url: `${import.meta.env.BASE_URL}demo/preview.mp4`,
    subtitles: [],
    segments: [{ kind: "intro" as const, start: 3, end: 8 }],
    providerId: "demo-preview",
  }
  return {
    device,
    jellyfin: null,
    log: new MemoryPlaybackLog(),
    service: new PlaybackService(
      {
        resolve: async () => ok({ best: source, fallbacks: [] }),
        providerFor: () => undefined,
      },
      {
        nextEpisode: async () => ok({ season: 1, episode: 3 }),
        nextUp: async (_target, ref: MediaRef) =>
          ok(
            ref.kind === "episode" && ref.episode < 10
              ? { season: ref.season, episode: ref.episode + 1, title: "Sample episode" }
              : null,
          ),
        markWatched: async () => ok(undefined),
      },
    ),
  }
}
