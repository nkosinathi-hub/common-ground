import { describe, expect, it } from "vitest"
import { ok } from "@/shared/domain"
import type { WatchHistoryGateway } from "./ports"
import { WatchHistory } from "./watch-history"

function setup() {
  const calls: unknown[][] = []
  const gateway: WatchHistoryGateway = {
    markWatched: async (...args) => (calls.push(args), ok(undefined)),
    statuses: async (itemId) => (calls.push([itemId]), ok([])),
  }
  return { calls, history: new WatchHistory(gateway) }
}

describe("WatchHistory", () => {
  it("records an episode, or a film with no episode", async () => {
    const { calls, history } = setup()
    expect((await history.markWatched("i", { season: 2, episode: 3 }, "player")).ok).toBe(true)
    expect((await history.markWatched("i", null, "manual")).ok).toBe(true)
    expect(calls).toEqual([
      ["i", { season: 2, episode: 3 }, "player"],
      ["i", null, "manual"],
    ])
  })

  it("refuses an episode that cannot exist without asking the server", async () => {
    const { calls, history } = setup()
    for (const tick of [
      { season: -1, episode: 1 },
      { season: 1, episode: 0 },
      { season: 1.5, episode: 2 },
    ])
      expect((await history.markWatched("i", tick, "manual")).ok).toBe(false)
    expect(calls).toEqual([])
  })

  it("reads each episode's status for a title", async () => {
    const { calls, history } = setup()
    expect(await history.statuses("i")).toEqual({ ok: true, value: [] })
    expect(calls).toEqual([["i"]])
  })
})
