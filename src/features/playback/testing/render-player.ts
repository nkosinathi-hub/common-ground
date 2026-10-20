import { ok, type DeviceStore } from "../../../shared/domain"
import { PlaybackService } from "../application/playback-service"
import type { PlaybackPorts, ProviderAccount } from "../application/ports"
import type { MediaRef } from "../domain/media-ref"
import type { PlayableSource } from "../domain/source.types"
import { fakeSource } from "./fake-plugin"

function memoryDevice(): DeviceStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    read: (key) => data.get(key) ?? null,
    write: (key, value) => void (value === null ? data.delete(key) : data.set(key, value)),
  }
}

/** A player context whose resolver answers the given sources, recording what it was asked. */
export function playerFakes(sources: PlayableSource[], ports: Partial<PlaybackPorts> = {}) {
  const asked: MediaRef[] = []
  const resolver = {
    resolve: async (ref: MediaRef) => {
      asked.push(ref)
      const [best, ...fallbacks] = sources
      return ok({ best: best ?? fakeSource("a", "a"), fallbacks })
    },
    providerFor: () => undefined,
  }
  const watched: MediaRef[] = []
  const service = new PlaybackService(resolver, {
    nextEpisode: async () => ok(null),
    nextUp: async () => ok(null),
    markWatched: async (_target, ref) => {
      watched.push(ref)
      return ok(undefined)
    },
    ...ports,
  })
  const device = memoryDevice()
  return { service, device, asked, watched, account: null as ProviderAccount | null }
}

export const fileSource = (url: string, extra: Partial<PlayableSource> = {}): PlayableSource => ({
  ...{ kind: "file", url, mime: "video/mp4", subtitles: [], segments: [], providerId: "a" },
  ...extra,
})
