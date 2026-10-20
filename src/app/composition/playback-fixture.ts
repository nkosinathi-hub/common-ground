// Relative imports only: vite.config.ts loads this chain before Vite's aliases exist.
import type { ProviderPlugin } from "../../features/playback/domain/plugin.types"
import type { ProviderConfig } from "../../features/playback/domain/provider.types"
import { fixturePlugin } from "../../features/playback/infrastructure/fixture/plugin"

/** The end-to-end build's media server; production builds never set it. */
export interface FixtureBuild {
  /** VITE_PLAYBACK_FIXTURE_ORIGIN: a server on this machine serving tests/fixtures/playback. */
  readonly fixtureOrigin?: string
}

const LOOPBACK = /^http:\/\/127\.0\.0\.1:\d{2,5}$/

/**
 * Playwright's build plays the committed sample HLS, DASH and MP4 through the real player. The
 * fixture only ever names this machine, so it cannot become a way to play from anywhere else.
 */
export function fixtureBuild(origin: string | undefined): FixtureBuild {
  if (!origin) return {}
  if (!LOOPBACK.test(origin))
    throw new Error(`VITE_PLAYBACK_FIXTURE_ORIGIN must be a loopback http://127.0.0.1:<port>`)
  return { fixtureOrigin: origin }
}

export const fixturePlugins = (build: FixtureBuild): ProviderPlugin[] =>
  build.fixtureOrigin ? [fixturePlugin(build.fixtureOrigin)] : []

export const fixtureConfigs = (build: FixtureBuild): ProviderConfig[] =>
  build.fixtureOrigin
    ? [
        {
          ...{ type: "fixture", id: "fixture", enabled: true, priority: 0 },
          ...{ timeoutMs: 5_000, retries: 0, options: { catalog: "/catalog" } },
        },
      ]
    : []
