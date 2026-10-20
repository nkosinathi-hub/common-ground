import { describe, expect, it } from "vitest"
import { BLENDER_TITLES } from "./blender"
import { findTitle, validatePeerTubeOptions, type PeerTubeTitle } from "./titles"

const UUID = "6402b77c-b61f-4a06-96ca-c8420a2becf4"
const reason = (raw: unknown) => {
  const result = validatePeerTubeOptions(raw)
  return result.ok ? null : result.error.message
}

describe("validatePeerTubeOptions", () => {
  it("accepts the shipped Blender catalog as it stands", () => {
    expect(validatePeerTubeOptions({ titles: BLENDER_TITLES })).toEqual({
      ok: true,
      value: { titles: BLENDER_TITLES },
    })
  })

  it.each([
    [null, "titles must be a non-empty list"],
    [{ titles: [] }, "titles must be a non-empty list"],
    [{ titles: [{ tmdbId: 0, video: UUID }] }, "titles[0]: tmdbId must be a TMDB id"],
    [{ titles: [{ tmdbId: 1, video: "../admin" }] }, "titles[0]: video must be a PeerTube uuid"],
    [{ titles: [{ tmdbId: 1, season: 0, episode: 1, video: UUID }] }, "specials are not played"],
    [{ titles: [{ tmdbId: 1, season: 1, video: UUID }] }, "needs season and episode"],
    [{ titles: [{ tmdbId: 1, episodeTmdbId: 5, video: UUID }] }, "episodeTmdbId belongs"],
    [{ titles: [{ tmdbId: 1, video: UUID, licence: "http://example.org/free" }] }, "licence"],
  ])("refuses %j with a message naming the fault", (raw, message) => {
    expect(reason(raw)).toContain(message)
  })

  it("names the first bad entry by its index", () => {
    const titles = [{ tmdbId: 1, video: UUID }, { tmdbId: 2 }]
    expect(reason({ titles })).toMatch(/^titles\[1\]/)
  })
})

describe("findTitle", () => {
  const titles: PeerTubeTitle[] = [
    { tmdbId: 7, video: "movie" },
    { tmdbId: 7, season: 1, episode: 1, episodeTmdbId: 70, video: "s1e1" },
    { tmdbId: 7, season: 1, episode: 2, video: "s1e2" },
  ]

  it("matches a movie only on an entry without a season", () => {
    expect(findTitle(titles, { kind: "movie", tmdbId: 7 })?.video).toBe("movie")
    expect(findTitle(titles, { kind: "movie", tmdbId: 8 })).toBeUndefined()
  })

  it("prefers TMDB's episode id over numbers that disagree", () => {
    const ref = { kind: "episode", tmdbId: 7, season: 1, episode: 2, episodeTmdbId: 70 } as const
    expect(findTitle(titles, ref)?.video).toBe("s1e1")
  })

  it("falls back to season and number when the episode id is unknown or unmatched", () => {
    const ref = { kind: "episode", tmdbId: 7, season: 1, episode: 2 } as const
    expect(findTitle(titles, ref)?.video).toBe("s1e2")
    expect(findTitle(titles, { ...ref, episodeTmdbId: 99 })?.video).toBe("s1e2")
    expect(findTitle(titles, { ...ref, episode: 3 })).toBeUndefined()
  })
})
