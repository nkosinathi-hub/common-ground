import { render } from "@testing-library/svelte"
import { appError, err, ok, type DeviceStore } from "@/shared/domain"
import Provided from "@/shared/ui/testing/Provided.svelte"
import type { PlaybackCatalog, PlayTarget } from "../application/ports"
import TitlePlaybackHarness from "./TitlePlaybackHarness.svelte"
import { providePlayback } from "./context"
import { PlaybackService } from "../application/playback-service"
import type { MediaRef } from "../domain/media-ref"
import type { PlayableSource } from "../domain/source.types"

export function renderTitlePlayback(sources: PlayableSource[], target: PlayTarget) {
  const asked: MediaRef[] = []
  const service = new PlaybackService(
    {
      resolve: async (ref, options = {}) => {
        asked.push(ref)
        const eligible = sources.filter(
          (source) =>
            (!options.providerIds || options.providerIds.includes(source.providerId)) &&
            !options.excludeProviderIds?.includes(source.providerId),
        )
        const [best, ...fallbacks] = eligible
        return best
          ? ok({ best, fallbacks })
          : err(appError("not_found", "Nothing can play this title right now"))
      },
      providerFor: () => undefined,
    },
    {
      nextEpisode: async () => ok(null),
      nextUp: async () => ok(null),
      markWatched: async () => ok(undefined),
    },
  )
  const device: DeviceStore = { read: () => null, write: () => {} }
  const catalog: PlaybackCatalog = {
    details: async (_spaceId, type) =>
      ok({
        trailerAvailable: true,
        seasons:
          type === "tv"
            ? [
                { number: 1, name: "Season 1", episodeCount: 2 },
                { number: 2, name: "Season 2", episodeCount: 1 },
              ]
            : [],
      }),
    season: async (_spaceId, _id, season) =>
      ok({
        episodes:
          season === 1
            ? [
                { number: 1, name: "Pilot" },
                { number: 2, name: "Second Episode" },
              ]
            : [{ number: 1, name: "New Season" }],
      }),
  }
  const provide = () => providePlayback({ service, device, account: null })
  render(Provided, {
    props: {
      provide,
      component: TitlePlaybackHarness,
      props: { target, catalog },
    },
  })
  return { asked, service }
}
