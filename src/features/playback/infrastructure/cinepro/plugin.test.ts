import { describe, expect, it, vi } from "vitest"
import { ok } from "../../../../shared/domain/result"
import { MemoryCredentials } from "../../testing/fake-plugin"
import { cineproPlugin } from "./plugin"

const origin = "https://cinepro.example.org"
const deps = (fetch: typeof globalThis.fetch) => ({
  id: "cinepro",
  fetch,
  clock: () => 0,
  log: { record: vi.fn() },
  credentials: new MemoryCredentials(),
  tmdb: { imdbId: async () => ok(null), videos: async () => ok([]) },
})
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
// A fresh Response per call: a body reads once.
const answering = (body: unknown, status = 200) =>
  vi.fn<typeof globalThis.fetch>().mockImplementation(() => Promise.resolve(response(body, status)))
const urlOf = (input: RequestInfo | URL) =>
  typeof input === "string" ? input : input instanceof URL ? input.href : input.url
const signal = () => new AbortController().signal
const movie = { kind: "movie", tmdbId: 603 } as const

describe("CinePro Core plugin", () => {
  it("resolves movie and episode IDs through the documented routes", async () => {
    const fetch = answering({
      responseId: "r1",
      sources: [{ url: "/v1/proxy?data=abc", type: "hls", quality: "720p" }],
      subtitles: [],
    })
    const built = cineproPlugin(origin).create({ serverUrl: origin }, deps(fetch))
    const film = await built.resolve(movie, signal())
    const episode = { kind: "episode", tmdbId: 1396, season: 1, episode: 2 } as const
    expect((await built.resolve(episode, signal())).ok).toBe(true)
    expect(film).toMatchObject({ ok: true, value: [{ kind: "hls", providerId: "cinepro" }] })
    expect(fetch.mock.calls.map(([input]) => urlOf(input))).toEqual([
      `${origin}/v1/movies/603`,
      `${origin}/v1/tv/1396/seasons/1/episodes/2`,
    ])
  })

  it("answers not_found without a usable source, and passes a Core failure on", async () => {
    const empty = cineproPlugin(origin).create(
      { serverUrl: origin },
      deps(answering({ sources: [] })),
    )
    const none = await empty.resolve(movie, signal())
    expect(none).toMatchObject({ ok: false, error: { kind: "not_found" } })
    const down = cineproPlugin(origin).create({ serverUrl: origin }, deps(answering({}, 503)))
    expect(await down.resolve(movie, signal())).toMatchObject({ error: { kind: "network" } })
  })

  it("uses the Core root for health, and takes only the build's origin as its server", async () => {
    const fetch = answering({ status: "operational" })
    const plugin = cineproPlugin(`${origin}/`)
    expect((await plugin.create({ serverUrl: origin }, deps(fetch)).health(signal())).ok).toBe(true)
    expect(fetch.mock.calls[0]?.[0]).toBe(`${origin}/`)
    expect(plugin.validateOptions({ serverUrl: `${origin}/` })).toEqual(ok({ serverUrl: origin }))
    expect(plugin.validateOptions({ serverUrl: "https://other.example.org" }).ok).toBe(false)
    expect(plugin.security.connect).toEqual([origin])
  })

  it("refuses http except loopback in a build that allows it, and never a wildcard", () => {
    expect(() => cineproPlugin("http://cinepro.example.org")).toThrow(/https/)
    expect(() => cineproPlugin("http://127.0.0.1:3000")).toThrow(/https/)
    expect(cineproPlugin("http://127.0.0.1:3000", { allowLoopback: true }).type).toBe("cinepro")
    expect(() => cineproPlugin("https://*.example.org")).toThrow(/exact origin/)
  })
})
