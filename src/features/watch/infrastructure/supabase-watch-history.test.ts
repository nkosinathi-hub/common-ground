import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient } from "@/shared/infrastructure/testing/recording-client"
import { SupabaseWatchHistory } from "./supabase-watch-history"

describe("SupabaseWatchHistory", () => {
  it("ticks through mark_episode_watched; a film sends no season or episode", async () => {
    const { client, calls } = recordingClient({ data: null, error: null })
    const history = new SupabaseWatchHistory(client as Db)
    await history.markWatched("i", { season: 1, episode: 2 }, "player")
    await history.markWatched("i", null, "manual")
    expect(calls).toEqual([
      [
        "rpc",
        "mark_episode_watched",
        { item: "i", watched_season: 1, watched_episode: 2, origin: "player" },
      ],
      [
        "rpc",
        "mark_episode_watched",
        { item: "i", watched_season: null, watched_episode: null, origin: "manual" },
      ],
    ])
  })
})
