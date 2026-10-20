import { describe, expect, it } from "vitest"
import { appError, err, ok } from "../../../../shared/domain/result"
import type { Trailer } from "../../domain/plugin.types"
import { validateSource } from "../../domain/validate-source"
import { fakeDeps } from "../../testing/fake-plugin"
import { youtubeTrailerPlugin } from "./plugin"

const video = (key: string, extra: Partial<Trailer> = {}): Trailer => ({
  ...{ key, site: "YouTube", type: "Trailer", official: true },
  ...extra,
})

function provider(videos: Trailer[] | null) {
  const deps = fakeDeps()
  const tmdb = {
    ...deps.tmdb,
    videos: async () => (videos ? ok(videos) : err(appError("network", "down"))),
  }
  return youtubeTrailerPlugin.create(null, { ...deps, tmdb, id: "yt" })
}

const movie = { kind: "movie", tmdbId: 603 } as const
const signal = new AbortController().signal

describe("youtube-trailer plugin", () => {
  it("embeds official YouTube trailers from TMDB as youtube-nocookie iframes", async () => {
    const result = await provider([
      video("teaser00001", { type: "Teaser" }),
      video("vimeo000001", { site: "Vimeo" }),
      video("fanmade0001", { official: false }),
      video("m8e-FF8MsqU"),
    ]).resolve(movie, signal)
    expect(result).toEqual(
      ok([
        {
          kind: "embed",
          url: "https://www.youtube-nocookie.com/embed/m8e-FF8MsqU",
          subtitles: [],
          segments: [],
          providerId: "yt",
        },
      ]),
    )
  })

  it("refuses a key that is not a YouTube video id", async () => {
    const result = await provider([video("../../evil"), video("short")]).resolve(movie, signal)
    expect(result).toMatchObject({ ok: false, error: { kind: "not_found" } })
  })

  it("passes TMDB failures through for retry decisions", async () => {
    expect(await provider(null).resolve(movie, signal)).toMatchObject({
      error: { kind: "network" },
    })
  })

  it("declares only the nocookie frame origin, with popups for 'Watch on YouTube'", async () => {
    expect(youtubeTrailerPlugin.security.frames).toEqual(["https://www.youtube-nocookie.com"])
    expect(youtubeTrailerPlugin.security.sandbox).toContain("allow-popups")
    expect(youtubeTrailerPlugin.security.media).toEqual([])
    const yt = provider([video("m8e-FF8MsqU")])
    const result = await yt.resolve(movie, signal)
    if (!result.ok || !result.value[0]) throw new Error("fixture")
    const checked = validateSource(result.value[0], youtubeTrailerPlugin.security)
    expect(checked.ok && checked.value.sandbox).toContain("allow-popups")
    expect(yt.supports({ kind: "episode", tmdbId: 1, season: 1, episode: 1 })).toBe(true)
    expect((await yt.health(signal)).ok).toBe(true)
  })
})
