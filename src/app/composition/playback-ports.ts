import { Capacitor } from "@capacitor/core"
import { ok } from "@/shared/domain"
import { preferencesStorage } from "@/shared/infrastructure/preferences-storage"
import { deviceStore } from "@/shared/ui"
import type { WatchHistory, WatchService } from "@/features/watch"
import type { PlaybackPorts } from "@/features/playback"
import type { KeyValue } from "@/features/playback/infrastructure/device-credentials"
import type { JellyfinAccount } from "@/features/playback/infrastructure/jellyfin/account"

/** Tokens live in Preferences on Android and in the prefixed device store on the web. */
export function deviceKeyValue(): KeyValue {
  if (Capacitor.isNativePlatform())
    return {
      get: (key) => preferencesStorage.getItem(key),
      set: (key, value) => preferencesStorage.setItem(key, value),
      remove: (key) => preferencesStorage.removeItem(key),
    }
  const store = deviceStore()
  return {
    get: async (key) => store.read(key),
    set: async (key, value) => store.write(key, value),
    remove: async (key) => store.write(key, null),
  }
}

/** Where this person is: Jellyfin NextUp when signed in, else their saved watch progress. */
export function playbackPorts(
  watch: WatchService,
  jellyfin: JellyfinAccount | null,
  history: WatchHistory,
): PlaybackPorts {
  const fromJellyfin = async (tmdbId: number) =>
    jellyfin && (await jellyfin.signedIn()) ? jellyfin.nextUp(tmdbId) : ok(null)
  return {
    nextEpisode: async (target) => {
      const next = await fromJellyfin(target.catalog.id)
      if (next.ok && next.value) return ok(next.value)
      const progress = await watch.progress(target.itemId)
      if (!progress.ok) return progress
      const mine = progress.value.entries.find((e) => e.userId === progress.value.me)
      return ok(
        mine?.season && mine.episode ? { season: mine.season, episode: mine.episode } : null,
      )
    },
    nextUp: async (target, current) => {
      const next = await fromJellyfin(target.catalog.id)
      if (!next.ok || !next.value || current.kind !== "episode") return ok(null)
      const same = next.value.season === current.season && next.value.episode === current.episode
      return ok(
        same ? { season: current.season, episode: current.episode + 1, title: "" } : next.value,
      )
    },
    // 90% played: the person's history, which moves their own place forward.
    markWatched: (target, ref) =>
      history.markWatched(
        target.itemId,
        ref.kind === "episode" ? { season: ref.season, episode: ref.episode } : null,
        "player",
      ),
  }
}
