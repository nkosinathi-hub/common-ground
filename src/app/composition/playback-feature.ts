import { PlaybackService, providePlayback } from "@/features/playback"
import { DeviceCredentials } from "@/features/playback/infrastructure/device-credentials"
import type { WatchHistory, WatchService } from "@/features/watch"
import { deviceStore } from "@/shared/ui"
import { composePlayback } from "./playback"
import type { ActivePlayer } from "./player-bridge"
import { deviceKeyValue, pendingTmdb, playbackPorts } from "./playback-ports"

const CHOICES = "playback-providers"

/** Playback for the watch item page; the build's plugins and Jellyfin origin are fixed. */
export function composePlaybackFeature(watch: WatchService, history: WatchHistory) {
  const device = deviceStore()
  const jellyfinOrigin = (import.meta.env.VITE_JELLYFIN_ORIGIN as string | undefined) || undefined
  const playback = composePlayback({
    build: jellyfinOrigin ? { jellyfinOrigin } : {},
    credentials: new DeviceCredentials(deviceKeyValue()),
    tmdb: pendingTmdb,
    choices: device.read(CHOICES),
  })
  const service = new PlaybackService(
    playback.resolver,
    playbackPorts(watch, playback.jellyfin, history),
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
