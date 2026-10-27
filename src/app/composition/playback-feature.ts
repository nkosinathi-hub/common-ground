import { PlaybackService, providePlayback } from "@/features/playback"
import { DeviceCredentials } from "@/features/playback/infrastructure/device-credentials"
import type { WatchHistory, WatchService } from "@/features/watch"
import type { CatalogService } from "@/features/catalog"
import { deviceStore } from "@/shared/ui"
import { composePlayback } from "./playback"
import { fixtureBuild } from "./playback-fixture"
import type { ActivePlayer } from "./player-bridge"
import type { TmdbLookup } from "@/features/playback/domain/plugin.types"
import { deviceKeyValue, playbackPorts } from "./playback-ports"

const CHOICES = "playback-providers"

/** Playback for the watch item page; the build's plugins and Jellyfin origin are fixed. */
export function composePlaybackFeature(
  watch: WatchService,
  history: WatchHistory,
  catalog: CatalogService,
  tmdb: TmdbLookup,
) {
  const device = deviceStore()
  const jellyfinOrigin = (import.meta.env.VITE_JELLYFIN_ORIGIN as string | undefined) || undefined
  const cineproOrigin =
    (import.meta.env.VITE_CINEPRO_CORE_ORIGIN as string | undefined) || undefined
  const fixture = fixtureBuild(import.meta.env.VITE_PLAYBACK_FIXTURE_ORIGIN as string | undefined)
  const playback = composePlayback({
    build: {
      ...(jellyfinOrigin ? { jellyfinOrigin } : {}),
      ...(cineproOrigin ? { cineproOrigin, allowCineproLoopback: import.meta.env.DEV } : {}),
      ...fixture,
    },
    credentials: new DeviceCredentials(deviceKeyValue()),
    tmdb,
    choices: device.read(CHOICES),
  })
  const service = new PlaybackService(
    playback.resolver,
    playbackPorts(watch, playback.jellyfin, history, catalog),
  )
  return { service, device, jellyfin: playback.jellyfin, log: playback.log }
}

export type PlaybackFeature = ReturnType<typeof composePlaybackFeature>

export function providePlaybackFeature(feature: PlaybackFeature, active: ActivePlayer): void {
  providePlayback({
    service: feature.service,
    device: feature.device,
    account: feature.jellyfin,
    attachVideo: (video) => active.attach(video),
  })
}
