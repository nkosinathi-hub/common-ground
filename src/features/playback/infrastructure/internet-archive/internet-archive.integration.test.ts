// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { ok } from "../../../../shared/domain/result"
import type { TmdbLookup } from "../../domain/plugin.types"
import { archiveRoutes } from "../../testing/archive-routes"
import { fakeDeps } from "../../testing/fake-plugin"
import { startFixtureServer, type FixtureServer } from "../../testing/fixture-server"
import { internetArchivePlugin } from "./plugin"

let server: FixtureServer
beforeAll(async () => (server = await startFixtureServer(archiveRoutes)))
afterAll(() => server.close())

function provider(imdb: string | null) {
  const endpoints = {
    wikidata: `${server.origin}/sparql`,
    archive: server.origin,
    media: [server.origin],
  }
  const plugin = internetArchivePlugin(endpoints)
  const tmdb: TmdbLookup = { imdbId: async () => ok(imdb), videos: async () => ok([]) }
  const options = plugin.validateOptions({})
  if (!options.ok) throw new Error("options")
  return { plugin, provider: plugin.create(options.value, { ...fakeDeps(), tmdb, id: "ia" }) }
}

const movie = { kind: "movie", tmdbId: 10331 } as const
const signal = () => AbortSignal.timeout(2_000)

describe("internet-archive plugin", () => {
  it("only plays films", () => {
    const { provider: ia, plugin } = provider("tt0063350")
    expect(ia.supports({ kind: "episode", tmdbId: 1, season: 1, episode: 1 })).toBe(false)
    expect(plugin.capabilities.media).toEqual(["movie"])
  })

  it("goes TMDB, IMDb, Wikidata P345 to P724, and returns the MP4 then the embed", async () => {
    const result = await provider("tt0063350").provider.resolve(movie, signal())
    expect(result).toEqual(
      ok([
        expect.objectContaining({
          kind: "file",
          url: `${server.origin}/download/night-of-the-living-dead/Night%201968.mp4`,
          mime: "video/mp4",
        }),
        expect.objectContaining({
          kind: "embed",
          url: `${server.origin}/embed/night-of-the-living-dead`,
        }),
      ]),
    )
  })

  it("refuses an item without an explicit public-domain or CC licence", async () => {
    const result = await provider("tt0000002").provider.resolve(movie, signal())
    expect(result).toMatchObject({ ok: false, error: { kind: "not_found" } })
  })

  it("offers only the embed when no MP4 exists, and nothing without an IMDb or Wikidata match", async () => {
    const embedOnly = await provider("tt0000003").provider.resolve(movie, signal())
    expect(embedOnly).toMatchObject({ ok: true, value: [{ kind: "embed" }] })
    expect((await provider(null).provider.resolve(movie, signal())).ok).toBe(false)
    expect((await provider("tt9999999").provider.resolve(movie, signal())).ok).toBe(false)
  })
})
