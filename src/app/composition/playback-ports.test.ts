import { describe, expect, it, vi } from "vitest"
import { ok } from "@/shared/domain"
import type { WatchHistory, WatchService } from "@/features/watch"
import type { CatalogService } from "@/features/catalog"
import { playbackPorts } from "./playback-ports"

const target = { spaceId: "s", itemId: "i", catalog: { type: "tv", id: 1399 } } as const

describe("playbackPorts.markWatched", () => {
  it("records a watched episode in the person's history as the in-app player", async () => {
    const markWatched = vi.fn(async () => ok(undefined))
    const history = { markWatched } as unknown as WatchHistory
    const ports = playbackPorts({} as WatchService, null, history, {} as CatalogService)
    await ports.markWatched(target, { kind: "episode", tmdbId: 1399, season: 2, episode: 5 })
    await ports.markWatched(target, { kind: "movie", tmdbId: 603 })
    expect(markWatched.mock.calls).toEqual([
      ["i", { season: 2, episode: 5 }, "player"],
      ["i", null, "player"],
    ])
  })
})

describe("playbackPorts.nextEpisode", () => {
  it("moves beyond the last episode watched, including into the next season", async () => {
    const watch = {
      progress: vi.fn(async () =>
        ok({ me: "me", entries: [{ userId: "me", season: 1, episode: 10 }] }),
      ),
    } as unknown as WatchService
    const catalog = {
      details: vi.fn(async () =>
        ok({
          seasons: [
            { number: 0, episodeCount: 2 },
            { number: 1, episodeCount: 10 },
            { number: 2, episodeCount: 8 },
          ],
        }),
      ),
    } as unknown as CatalogService
    const ports = playbackPorts(watch, null, {} as WatchHistory, catalog)
    expect(await ports.nextEpisode(target)).toEqual(ok({ season: 2, episode: 1 }))
  })
})
