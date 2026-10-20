import { afterEach, describe, expect, it, vi } from "vitest"
import type { Db } from "@/shared/infrastructure/supabase"
import type { ChannelStatus } from "../application/ports"
import type { PartyMessage } from "../domain/messages"
import type { Presence } from "../domain/party-machine"
import { fakeRealtime } from "./fake-realtime"
import { SupabasePartyChannel } from "./supabase-party-channel"

const ana: Presence = { userId: "ana", ready: true, buffering: false, joinedAt: "t" }

async function open() {
  const fake = fakeRealtime()
  const got = {
    messages: [] as PartyMessage[],
    people: [] as Presence[][],
    status: [] as ChannelStatus[],
  }
  const connection = new SupabasePartyChannel(fake.db as unknown as Db).connect("p1", {
    onMessage: (m) => got.messages.push(m),
    onPresence: (p) => got.people.push([...p]),
    onStatus: (s) => got.status.push(s),
  })
  await vi.waitFor(() => expect(fake.calls).toContainEqual(["setAuth"]))
  return { fake, got, connection }
}

afterEach(() => vi.restoreAllMocks())

describe("SupabasePartyChannel", () => {
  it("joins the private party topic without hearing its own broadcasts", async () => {
    const { fake } = await open()
    expect(fake.calls[0]).toEqual([
      "channel",
      "party:p1",
      { config: { private: true, broadcast: { self: false }, presence: { key: "" } } },
    ])
  })

  it("passes on well-formed messages only", async () => {
    const { fake, got } = await open()
    fake.broadcast({ kind: "finished", from: "ben" })
    fake.broadcast({ kind: "finished" })
    expect(got.messages).toEqual([{ kind: "finished", from: "ben" }])
  })

  it("sends messages as party broadcasts", async () => {
    const { fake, connection } = await open()
    connection.send({ kind: "finished", from: "ana" })
    expect(fake.calls).toContainEqual([
      "send",
      { type: "broadcast", event: "party", payload: { kind: "finished", from: "ana" } },
    ])
  })

  it("reads presence, dropping anything malformed", async () => {
    const { fake, got } = await open()
    fake.presence({ a: [{ ...ana, presence_ref: "r1" }], b: [{ userId: 3 }] })
    expect(got.people).toEqual([[ana]])
  })

  it("tracks presence once subscribed, and again after every rejoin", async () => {
    const { fake, got, connection } = await open()
    connection.track(ana)
    expect(fake.calls.filter(([c]) => c === "track")).toEqual([])
    fake.status("SUBSCRIBED")
    fake.status("CHANNEL_ERROR")
    fake.status("SUBSCRIBED")
    expect(fake.calls.filter(([c]) => c === "track")).toEqual([
      ["track", ana],
      ["track", ana],
    ])
    expect(got.status).toEqual(["joined", "reconnecting", "joined"])
  })

  it("reports a missed heartbeat, and rejoins when the app comes back", async () => {
    const { fake, got } = await open()
    fake.status("SUBSCRIBED")
    fake.heartbeat("timeout")
    expect(got.status.at(-1)).toBe("reconnecting")
    fake.disconnect()
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible")
    document.dispatchEvent(new Event("visibilitychange"))
    expect(fake.calls).toContainEqual(["connect"])
    expect(got.status.at(-1)).toBe("joined")
  })

  it("leaves the channel and stops listening", async () => {
    const { fake, got, connection } = await open()
    connection.leave()
    expect(fake.calls).toContainEqual(["removeChannel", true])
    expect(got.status.at(-1)).toBe("closed")
    document.dispatchEvent(new Event("visibilitychange"))
    expect(fake.calls.filter(([c]) => c === "connect")).toEqual([])
  })
})
