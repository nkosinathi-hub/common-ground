import { PlaybackService } from "@/features/playback"
import { MemoryPlaybackLog } from "@/features/playback/infrastructure/memory-log"
import { appError, err, ok } from "@/shared/domain"
import { compose } from "../composition"
import { demoClient } from "./client"

/** Reuse every production service and adapter; replace only external playback with a preview. */
export function composeDemo() {
  const services = compose(demoClient())
  services.playback = {
    device: services.playback.device,
    jellyfin: null,
    log: new MemoryPlaybackLog(),
    service: new PlaybackService(
      {
        resolve: async () =>
          err(
            appError(
              "denied",
              "Playback is unavailable in the sample demo. Your real watchlist is unchanged.",
            ),
          ),
        providerFor: () => undefined,
      },
      {
        nextEpisode: async () => ok({ season: 1, episode: 3 }),
        nextUp: async () => ok(null),
        markWatched: async () => ok(undefined),
      },
    ),
  }
  return services
}
