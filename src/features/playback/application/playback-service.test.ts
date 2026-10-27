import { describe, expect, it, vi } from "vitest"
import { appError, err, ok } from "../../../shared/domain/result"
import type { MediaRef } from "../domain/media-ref"
import type { ResolveOptions } from "./source-resolver"
import { fakeSource } from "../testing/fake-plugin"
import { PlaybackService } from "./playback-service"
import type { PlaybackPorts, PlayTarget } from "./ports"

const movie: PlayTarget = { spaceId: "s", itemId: "i", catalog: { type: "movie", id: 603 } }
const show: PlayTarget = { ...movie, catalog: { type: "tv", id: 1399 } }

function setup(next: { season: number; episode: number } | null = null) {
  const resolve = vi.fn(async (ref: MediaRef, _options?: ResolveOptions) => {
    void ref
    return ok({ best: fakeSource("a", "a"), fallbacks: [] })
  })
  const nextEpisode = vi.fn<PlaybackPorts["nextEpisode"]>(async () => ok(next))
  const markWatched = vi.fn<PlaybackPorts["markWatched"]>(async () => ok(undefined))
  const nextUp = vi.fn(async () => ok({ season: 1, episode: 3, title: "Three" }))
  const resolver = { resolve, providerFor: () => undefined }
  const service = new PlaybackService(resolver, { nextEpisode, nextUp, markWatched }, () => 0)
  return { service, resolve, ports: { nextEpisode, markWatched } }
}

describe("PlaybackService", () => {
  it("plays a movie by its TMDB id", async () => {
    const { service, resolve } = setup()
    const result = await service.play(movie)
    expect(result).toMatchObject({ ok: true, value: { ref: { kind: "movie", tmdbId: 603 } } })
    expect(resolve.mock.calls[0]?.[0]).toEqual({ kind: "movie", tmdbId: 603 })
  })

  it("plays a series from this person's next episode, or S1E1", async () => {
    const at = setup({ season: 2, episode: 4 })
    expect(await at.service.play(show)).toMatchObject({ value: { ref: { season: 2, episode: 4 } } })
    const fresh = setup(null)
    expect(await fresh.service.play(show)).toMatchObject({
      value: { ref: { season: 1, episode: 1 } },
    })
  })

  it("plays a chosen episode when asked, and passes track choices to the resolver", async () => {
    const { service, resolve } = setup()
    await service.play(show, { season: 3, episode: 2 }, { audioIndex: 1 })
    expect(resolve.mock.calls[0]).toEqual([
      { kind: "episode", tmdbId: 1399, season: 3, episode: 2 },
      { prefs: { audioIndex: 1 } },
    ])
  })

  it("restricts a trailer request to its explicit provider", async () => {
    const { service, resolve } = setup()
    await service.play(movie, undefined, undefined, undefined, { providerIds: ["youtube-trailer"] })
    expect(resolve.mock.calls[0]?.[1]).toEqual({ providerIds: ["youtube-trailer"] })
  })

  it("passes port and validation failures through", async () => {
    const { service, ports } = setup()
    ports.nextEpisode.mockResolvedValue(err(appError("network", "down")))
    expect(await service.play(show)).toMatchObject({ ok: false, error: { kind: "network" } })
    const bad = { ...movie, catalog: { type: "movie", id: 0 } } as const
    expect(await service.play(bad)).toMatchObject({ ok: false, error: { kind: "validation" } })
  })

  it("asks what plays next only for episodes, and builds a progress reporter", async () => {
    const { service, ports } = setup()
    expect(await service.nextUp(movie, { kind: "movie", tmdbId: 603 })).toEqual(ok(null))
    const episode = { kind: "episode", tmdbId: 1399, season: 1, episode: 2 } as const
    expect(await service.nextUp(show, episode)).toMatchObject({ value: { episode: 3 } })
    const reporter = service.reporter(fakeSource("a", "a"), show, episode)
    await reporter.tick(95, 100, false)
    expect(ports.markWatched).toHaveBeenCalledWith(show, episode)
  })
})
