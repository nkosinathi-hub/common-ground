// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { startFixtureServer, type FixtureServer } from "../../testing/fixture-server"
import { episodeOf as episode, jellyfinProvider } from "../../testing/jellyfin-provider"
import { jellyfinRoutes, TOKEN } from "../../testing/jellyfin-routes"
import { jellyfinPlugin } from "./plugin"

let server: FixtureServer
beforeAll(async () => (server = await startFixtureServer(jellyfinRoutes)))
afterAll(() => server.close())

const provider = (signedIn = true) =>
  jellyfinProvider(
    jellyfinPlugin(server.origin, () => true),
    server.origin,
    signedIn,
  )
const signal = () => AbortSignal.timeout(2_000)

describe("jellyfin plugin against a local stand-in", () => {
  it("maps a movie by ProviderIds.Tmdb to a direct stream with segments, subtitles and resume", async () => {
    const { jellyfin } = await provider()
    const result = await jellyfin.resolve({ kind: "movie", tmdbId: 603 }, signal())
    if (!result.ok) throw new Error(result.error.message)
    const [source] = result.value
    expect(source).toMatchObject({
      kind: "file",
      url: `${server.origin}/Videos/m1/stream?static=true&mediaSourceId=ms-m1`,
      quality: 1080,
      resumeSeconds: 42,
      providerId: "jf",
      providerData: { itemId: "m1", mediaSourceId: "ms-m1", playSessionId: "ps1" },
    })
    expect(source?.segments).toEqual([
      { kind: "intro", start: 5, end: 65 },
      { kind: "credits", start: 5000, end: 5100 },
    ])
    const vtt = `${server.origin}/Videos/m1/ms/Subtitles/2/0/Stream.vtt`
    expect(source?.subtitles).toEqual([{ url: vtt, language: "eng", label: "English" }])
    expect(source?.requestHeaders?.Authorization).toContain(`Token="${TOKEN}"`)
  })

  it("never puts the token in any URL it returns", async () => {
    const { jellyfin } = await provider()
    for (const ref of [{ kind: "movie", tmdbId: 603 } as const, episode(1, 1)]) {
      const result = await jellyfin.resolve(ref, signal())
      if (!result.ok) throw new Error(result.error.message)
      const urls = result.value.flatMap((s) => [s.url, ...s.subtitles.map((t) => t.url)])
      expect(urls.length).toBeGreaterThan(0)
      for (const url of urls) expect(url).not.toContain(TOKEN)
    }
  })

  it("plays an episode as HLS when direct play is off, without the api_key", async () => {
    const { jellyfin } = await provider()
    const result = await jellyfin.resolve(episode(1, 1), signal())
    expect(result).toMatchObject({
      ok: true,
      value: [
        {
          kind: "hls",
          url: `${server.origin}/videos/e1/master.m3u8?MediaSourceId=ms&PlaySessionId=ps1`,
        },
      ],
    })
  })

  it("matches a multi-episode file by its range and reports the range", async () => {
    const { jellyfin } = await provider()
    const result = await jellyfin.resolve(episode(1, 3), signal())
    expect(result).toMatchObject({ ok: true, value: [{ episodes: { from: 2, to: 3 } }] })
  })

  it("matches by the episode's TMDB id first and flags a numbering mismatch", async () => {
    const { jellyfin, log } = await provider()
    const result = await jellyfin.resolve(episode(2, 4, 777), signal())
    expect(result).toMatchObject({ ok: true, value: [{ providerData: { itemId: "e9" } }] })
    expect(log.entries).toContainEqual(expect.objectContaining({ outcome: "mismatch" }))
  })

  it("answers not_found for a title or episode the library lacks", async () => {
    const { jellyfin } = await provider()
    expect(await jellyfin.resolve({ kind: "movie", tmdbId: 1 }, signal())).toMatchObject({
      ok: false,
      error: { kind: "not_found" },
    })
    expect((await jellyfin.resolve(episode(3, 1), signal())).ok).toBe(false)
  })

  it("asks for sign-in without a token, and probes health without one", async () => {
    const { jellyfin } = await provider(false)
    expect(await jellyfin.resolve({ kind: "movie", tmdbId: 603 }, signal())).toMatchObject({
      error: { kind: "unauthenticated" },
    })
    expect((await jellyfin.health(signal())).ok).toBe(true)
  })
})
