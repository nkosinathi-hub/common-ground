// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { fakeDeps } from "../../testing/fake-plugin"
import { startFixtureServer, type FixtureServer } from "../../testing/fixture-server"
import { peertubeRoutes, PT, PT_TITLES } from "../../testing/peertube-routes"
import { peertubePlugin } from "./plugin"

let server: FixtureServer
beforeAll(async () => (server = await startFixtureServer(peertubeRoutes(() => server.origin))))
afterAll(() => server.close())

function provider() {
  const plugin = peertubePlugin({ origin: server.origin })
  const options = plugin.validateOptions({ titles: PT_TITLES })
  if (!options.ok) throw new Error(options.error.message)
  return plugin.create(options.value, { ...fakeDeps(), id: "pt" })
}

const movie = (tmdbId: number) => ({ kind: "movie", tmdbId }) as const
const signal = () => AbortSignal.timeout(2_000)

describe("peertube plugin against a stand-in instance", () => {
  it("returns HLS, then MP4 files up to 1080p, then the embed, with WebVTT captions", async () => {
    const result = await provider().resolve(movie(10378), signal())
    if (!result.ok) throw new Error(result.error.message)
    expect(result.value.map((s) => [s.kind, s.quality ?? null])).toEqual([
      ["hls", 720],
      ["file", 360],
      ["embed", null],
    ])
    const [hls, file, embed] = result.value
    expect(embed?.url).toBe(`${server.origin}/videos/embed/short0001`)
    expect(hls?.subtitles).toEqual([
      { url: `${server.origin}/captions/en.vtt`, language: "en", label: "English" },
    ])
    expect(await (await fetch(hls?.url ?? "")).text()).toContain("#EXTM3U")
    const bytes = await (await fetch(file?.url ?? "")).arrayBuffer()
    expect(new TextDecoder().decode(bytes.slice(4, 8))).toBe("ftyp")
    expect(await (await fetch(hls?.subtitles[0]?.url ?? "")).text()).toMatch(/^WEBVTT/)
  })

  it("plays a video without a licence field only when the curated title states one", async () => {
    expect((await provider().resolve(movie(45745), signal())).ok).toBe(true)
    expect(await provider().resolve(movie(2), signal())).toMatchObject({
      ok: false,
      error: { kind: "not_found", message: "No explicit Creative Commons licence" },
    })
  })

  it("refuses a private video, and answers not found for a title it does not carry", async () => {
    expect(await provider().resolve(movie(3), signal())).toMatchObject({
      error: { kind: "not_found" },
    })
    expect(provider().supports(movie(603))).toBe(false)
    expect((await provider().resolve(movie(603), signal())).ok).toBe(false)
  })

  it("maps an episode by TMDB episode id first, then by season and number", async () => {
    const pt = provider()
    const byId = { kind: "episode", tmdbId: 1399, season: 9, episode: 9, episodeTmdbId: 63057 }
    const byNumber = { kind: "episode", tmdbId: 1399, season: 1, episode: 2 } as const
    expect(pt.supports(byId as never)).toBe(true)
    expect(pt.supports(byNumber)).toBe(true)
    expect(pt.supports({ ...byNumber, episode: 3 })).toBe(false)
    expect(pt.supports(movie(1399))).toBe(false)
    const result = await pt.resolve(byNumber, signal())
    expect(result).toMatchObject({ ok: true, value: [{ kind: "hls" }, { kind: "file" }, {}] })
    expect(server.hits.some((h) => h.path === `/api/v1/videos/${PT.episode}`)).toBe(true)
  })

  it("probes health through the instance's public config", async () => {
    expect(await provider().health(signal())).toEqual({ ok: true, value: undefined })
  })

  it("passes a 500 on as a transient network error, for the resolver to retry", async () => {
    const plugin = peertubePlugin({ origin: server.origin })
    const result = await provider().resolve(movie(5), signal())
    if (result.ok) throw new Error("expected a failure")
    expect(plugin.classifyError(result.error)).toBe("transient")
  })
})
