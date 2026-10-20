import { describe, expect, it } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import { recordingClient, type Reply } from "@/shared/infrastructure/testing/recording-client"
import { SupabasePartyGateway } from "./supabase-party-gateway"

const gateway = (replies: Reply | Reply[]) => {
  const { client, calls } = recordingClient(replies)
  return { calls, parties: new SupabasePartyGateway(client as Db) }
}

describe("SupabasePartyGateway RPCs", () => {
  it("starts a series party with its range and season lengths", async () => {
    const { calls, parties } = gateway({ data: "p1", error: null })
    const range = { from: { season: 1, episode: 5 }, to: { season: 2, episode: 1 } }
    const input = {
      watchItemId: "w1",
      source: "external" as const,
      range: { ...range, seasonEpisodeCounts: [6] },
    }
    expect(await parties.start(input)).toEqual({ ok: true, value: "p1" })
    expect(calls).toContainEqual([
      "rpc",
      "start_party",
      { item: "w1", src: "external", s1: 1, e1: 5, s2: 2, e2: 1, counts: [6] },
    ])
  })

  it("starts a film party with no episodes", async () => {
    const { calls, parties } = gateway({ data: "p2", error: null })
    await parties.start({ watchItemId: "w1", source: "external", range: null })
    expect(calls).toContainEqual([
      "rpc",
      "start_party",
      { item: "w1", src: "external", s1: null, e1: null, s2: null, e2: null, counts: null },
    ])
  })

  it("names each membership RPC with the party", async () => {
    const { calls, parties } = gateway({ data: null, error: null })
    for (const call of ["join", "confirm", "finish", "cancel", "handover"] as const)
      await parties[call]("p1")
    expect(calls.filter(([m]) => m === "rpc").map(([, name, args]) => [name, args])).toEqual(
      ["join_party", "confirm_party", "finish_party", "cancel_party", "handover_party"].map((n) => [
        n,
        { party: "p1" },
      ]),
    )
  })

  it("maps the server's refusal", async () => {
    const { parties } = gateway({ data: null, error: { code: "42501", message: "x" } })
    expect(await parties.finish("p1")).toMatchObject({ ok: false, error: { kind: "denied" } })
  })
})
