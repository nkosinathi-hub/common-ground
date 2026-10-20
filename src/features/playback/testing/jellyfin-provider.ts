import type { MediaRef } from "../domain/media-ref"
import type { ProviderPlugin } from "../domain/plugin.types"
import type { Provider } from "../domain/provider.types"
import { fakeDeps, MemoryCredentials, RecordingLog } from "./fake-plugin"
import { TOKEN } from "./jellyfin-media"

/** A Jellyfin provider built by its plugin against the stand-in, signed in unless told not to. */
export async function jellyfinProvider(
  plugin: ProviderPlugin<{ serverUrl: string }>,
  origin: string,
  signedIn = true,
): Promise<{ jellyfin: Provider; log: RecordingLog }> {
  const credentials = new MemoryCredentials()
  if (signedIn) await credentials.set("jf", { token: TOKEN, userId: "u1", deviceId: "d1" })
  const log = new RecordingLog()
  const options = plugin.validateOptions({ serverUrl: origin })
  if (!options.ok) throw new Error(options.error.message)
  const deps = { ...fakeDeps(), credentials, log, id: "jf" }
  return { jellyfin: plugin.create(options.value, deps), log }
}

export const episodeOf = (season: number, n: number, episodeTmdbId?: number): MediaRef => ({
  ...{ kind: "episode", tmdbId: 1399, season, episode: n },
  ...(episodeTmdbId ? { episodeTmdbId } : {}),
})
