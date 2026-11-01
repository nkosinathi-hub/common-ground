import { expect, it, vi } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import type { Presence } from "../domain/party-machine"
import { fakeRealtime } from "./fake-realtime"
import { SupabasePartyChannel } from "./supabase-party-channel"

it("uses one membership track for a join, broadcasts player state, and refreshes late joiners", async () => {
  const fake = fakeRealtime()
  const people: Presence[][] = []
  const handlers = {
    onMessage: () => {},
    onStatus: () => {},
    onPresence: (p: readonly Presence[]) => people.push([...p]),
  }
  const conn = new SupabasePartyChannel(fake.db as unknown as Db).connect("p1", handlers)
  const mine = { userId: "me", ready: false, buffering: false, joinedAt: "today" }
  conn.track(mine)
  await vi.waitFor(() => expect(fake.calls).toContainEqual(["subscribe"]))
  fake.status("SUBSCRIBED")
  const config = fake.calls[0]?.[2] as { config: { presence: { key: string } } }
  const key = config.config.presence.key
  fake.presence({ [key]: [mine] })
  conn.track({ ...mine, ready: true })
  for (let i = 0; i < 50; i++) conn.track({ ...mine, ready: true, buffering: i % 2 === 0 })
  expect(fake.calls.filter(([name]) => name === "track")).toEqual([["track", mine]])
  fake.presence({ [key]: [mine], guest: [{ ...mine, userId: "guest" }] })
  expect(fake.calls).toContainEqual([
    "send",
    {
      type: "broadcast",
      event: "party-presence",
      payload: { key, person: { ...mine, ready: true, buffering: false } },
    },
  ])
  fake.playerState({ key: "guest", person: { ...mine, userId: "guest", ready: true } })
  expect(people.at(-1)?.every((p) => p.ready)).toBe(true)
  conn.leave()
})
