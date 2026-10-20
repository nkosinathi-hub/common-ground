import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabasePartyGateway } from "./supabase-party-gateway"

const row = {
  id: "p1",
  space_id: "s1",
  watch_item_id: "w1",
  host_id: "ana",
  source: "jellyfin",
  status: "live",
  from_season: 1,
  from_episode: 5,
  to_season: 2,
  to_episode: 1,
  season_episode_counts: [6],
  started_at: "2026-10-22T20:05:00Z",
  ended_at: null,
  created_at: "2026-10-22T20:00:00Z",
  members: [{ user_id: "ana", confirmed: true, joined_at: "2026-10-22T20:00:00Z" }],
}
const gateway = (replies: Reply | Reply[]) => {
  const { client, calls } = recordingClient(replies)
  return { calls, parties: new SupabasePartyGateway(client as Db) }
}

describe("SupabasePartyGateway reads", () => {
  it("reads a party with its range and members", async () => {
    const { calls, parties } = gateway({ data: [row], error: null })
    expect(await parties.get("p1")).toMatchObject({
      ok: true,
      value: {
        id: "p1",
        hostId: "ana",
        status: "live",
        range: {
          from: { season: 1, episode: 5 },
          to: { season: 2, episode: 1 },
          seasonEpisodeCounts: [6],
        },
        members: [{ userId: "ana", confirmed: true, joinedAt: "2026-10-22T20:00:00Z" }],
      },
    })
    expect(calls).toContainEqual(["eq", "id", "p1"])
  })

  it("says a party it cannot see is gone", async () => {
    const { parties } = gateway({ data: [], error: null })
    expect(await parties.get("p1")).toMatchObject({ ok: false, error: { kind: "not_found" } })
  })

  it("finds the open party for a title, a film's with no range", async () => {
    const film = {
      ...row,
      from_season: null,
      from_episode: null,
      to_season: null,
      to_episode: null,
      season_episode_counts: null,
    }
    const { calls, parties } = gateway([
      { data: [film], error: null },
      { data: [], error: null },
    ])
    expect(await parties.openFor("w1")).toMatchObject({ ok: true, value: { range: null } })
    expect(calls).toContainEqual(["in", "status", ["planned", "live"]])
    expect(await parties.openFor("w1")).toEqual({ ok: true, value: null })
  })

  it("reads together progress: an episode, a film watched, or nothing yet", async () => {
    const { parties } = gateway([
      { data: [{ season: 2, episode: 3 }], error: null },
      { data: [{ season: null, episode: null }], error: null },
      { data: [], error: null },
    ])
    expect(await parties.together("w1")).toEqual({
      ok: true,
      value: { at: { season: 2, episode: 3 } },
    })
    expect(await parties.together("w1")).toEqual({ ok: true, value: { at: null } })
    expect(await parties.together("w1")).toEqual({ ok: true, value: null })
  })
})
