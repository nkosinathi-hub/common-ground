// Relative imports only, and nothing that touches the DOM at load: vite.config.ts reads
// playbackPlugins() to build the CSP before Vite's aliases exist (scripts/vite/playback-csp.test.ts).
import { HealthMonitor } from "../../features/playback/application/health-monitor"
import { PluginRegistry } from "../../features/playback/application/plugin-registry"
import { SourceResolver } from "../../features/playback/application/source-resolver"
import { withStoredChoices } from "../../features/playback/application/stored-configs"
import type {
  CredentialStore,
  ProviderPlugin,
  TmdbLookup,
} from "../../features/playback/domain/plugin.types"
import type { ProviderConfig } from "../../features/playback/domain/provider.types"
import { browserCanPlay, browserProbe } from "../../features/playback/infrastructure/browser-media"
import { internetArchivePlugin } from "../../features/playback/infrastructure/internet-archive/plugin"
import { JellyfinAccount } from "../../features/playback/infrastructure/jellyfin/account"
import { jellyfinPlugin } from "../../features/playback/infrastructure/jellyfin/plugin"
import { MemoryPlaybackLog } from "../../features/playback/infrastructure/memory-log"
import { youtubeTrailerPlugin } from "../../features/playback/infrastructure/youtube-trailer/plugin"

/** Fixed at build time: the CSP and the plugins' policies come from the same values. */
export interface PlaybackBuild {
  /** VITE_JELLYFIN_ORIGIN: the household's own Jellyfin server, https only. */
  readonly jellyfinOrigin?: string
}

/** The only list of playback plugins. A new adapter is one file plus one line here. */
export function playbackPlugins(build: PlaybackBuild): ProviderPlugin[] {
  return [
    ...(build.jellyfinOrigin ? [jellyfinPlugin(build.jellyfinOrigin, browserProbe)] : []),
    internetArchivePlugin(),
    youtubeTrailerPlugin,
  ]
}

function defaultConfigs(build: PlaybackBuild): ProviderConfig[] {
  const entry = (type: string, priority: number, timeoutMs: number, retries: number) => ({
    ...{ type, id: type, enabled: true, priority, timeoutMs, retries, options: null },
  })
  return [
    ...(build.jellyfinOrigin
      ? [{ ...entry("jellyfin", 1, 8_000, 1), options: { serverUrl: build.jellyfinOrigin } }]
      : []),
    entry("internet-archive", 2, 8_000, 1),
    entry("youtube-trailer", 9, 5_000, 0),
  ]
}

export interface PlaybackDeps {
  readonly build: PlaybackBuild
  readonly credentials: CredentialStore
  readonly tmdb: TmdbLookup
  /** This person's stored on, off and order choices, as JSON, or null. */
  readonly choices: string | null
}

export function composePlayback(deps: PlaybackDeps) {
  const registry = new PluginRegistry()
  for (const plugin of playbackPlugins(deps.build)) {
    const registered = registry.register(plugin)
    if (!registered.ok) throw new Error(`${plugin.type}: ${registered.error.message}`)
  }
  const log = new MemoryPlaybackLog()
  const clock = () => Date.now()
  const shared = {
    ...{ log, clock, credentials: deps.credentials, tmdb: deps.tmdb },
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  }
  const configs = withStoredChoices(defaultConfigs(deps.build), deps.choices)
  const { providers, refused } = registry.fromConfig(configs, shared)
  const health = new HealthMonitor({ threshold: 3, cooldownMs: 60_000 }, clock)
  const resolver = new SourceResolver(providers, { health, log, clock, canPlay: browserCanPlay })
  const origin = deps.build.jellyfinOrigin?.replace(/\/+$/, "")
  const jellyfin = origin
    ? new JellyfinAccount({
        origin,
        fetch: shared.fetch,
        credentials: deps.credentials,
        providerId: "jellyfin",
      })
    : null
  return { resolver, refused, jellyfin, log }
}
