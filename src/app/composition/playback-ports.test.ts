import { describe, expect, it, vi } from "vitest"
import { ok } from "@/shared/domain"
import type { WatchHistory, WatchService } from "@/features/watch"
import { playbackPorts } from "./playback-ports"

const target = { spaceId: "s", itemId: "i", catalog: { type: "tv", id: 1399 } } as const

describe("playbackPorts.markWatched", () => {
  it("records a watched episode in the person's history as the in-app player", async () => {
    const markWatched = vi.fn(async () => ok(undefined))
    const history = { markWatched } as unknown as WatchHistory
    const ports = playbackPorts({} as WatchService, null, history)
    await ports.markWatched(target, { kind: "episode", tmdbId: 1399, season: 2, episode: 5 })
    await ports.markWatched(target, { kind: "movie", tmdbId: 603 })
    expect(markWatched.mock.calls).toEqual([
      ["i", { season: 2, episode: 5 }, "player"],
      ["i", null, "player"],
    ])
  })
})
