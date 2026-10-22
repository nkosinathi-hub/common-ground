import { describe, expect, it } from "vitest"
import { ok } from "@/shared/domain"
import { MemoryCredentials } from "@/features/playback/testing/fake-plugin"
import { composePlayback } from "./playback"

const deps = (jellyfinOrigin?: string, choices: string | null = null) => ({
  build: jellyfinOrigin ? { jellyfinOrigin } : {},
  credentials: new MemoryCredentials(),
  tmdb: { imdbId: async () => ok(null), videos: async () => ok([]) },
  choices,
})

describe("composePlayback", () => {
  it("builds every compiled-in provider, refusing none", () => {
    const playback = composePlayback(deps("https://jf.example.org/"))
    expect(playback.refused).toEqual([])
    expect(playback.jellyfin).not.toBeNull()
  })

  it("has no Jellyfin without a build origin, and honours stored on and off choices", async () => {
    const playback = composePlayback(deps(undefined, '[{"id":"internet-archive","enabled":false}]'))
    expect(playback.jellyfin).toBeNull()
    const result = await playback.resolver.resolve({ kind: "movie", tmdbId: 603 })
    expect(result).toMatchObject({ ok: false, error: { kind: "not_found" } })
  })

  it("registers the optional CinePro Core provider without replacing existing providers", () => {
    const playback = composePlayback({
      ...deps(),
      build: { cineproOrigin: "https://cinepro.example.org" },
    })
    expect(playback.refused).toEqual([])
    expect(playback.resolver).toBeDefined()
  })
})
