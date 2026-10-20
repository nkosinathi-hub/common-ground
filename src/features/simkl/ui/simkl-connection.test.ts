import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SimklService } from "../application/simkl-service"
import type { SimklLink } from "../domain/types"
import { FakeSimklGateway } from "../testing/fake-simkl-gateway"
import { SimklConnection } from "./simkl-connection.svelte"

const LINK = { connectedAt: "2026-03-01T10:00:00Z", lastSyncedAt: null }

function setup(link: SimklLink | null) {
  const gateway = new FakeSimklGateway(link)
  const connection = new SimklConnection(new SimklService(gateway))
  return { gateway, connection }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("SimklConnection", () => {
  it("loads whether Simkl is connected", async () => {
    const { connection } = setup(LINK)
    await connection.load()
    expect(connection.state).toEqual({ kind: "connected", link: LINK })
  })

  it("shows the code, polls at Simkl's interval, and settles once approved", async () => {
    const { gateway, connection } = setup(null)
    await connection.load()
    await connection.connect()
    expect(connection.state).toMatchObject({ kind: "pending", pin: { userCode: "ABCD-EFGH" } })
    await vi.advanceTimersByTimeAsync(5000)
    expect(gateway.calls.filter((c) => c.startsWith("poll"))).toEqual(["poll:5"])
    gateway.approve(LINK)
    await vi.advanceTimersByTimeAsync(5000)
    expect(connection.state).toEqual({ kind: "connected", link: LINK })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(gateway.calls.filter((c) => c.startsWith("poll"))).toHaveLength(2)
  })

  it("honours slow down by polling five seconds later from then on", async () => {
    const { gateway, connection } = setup(null)
    await connection.connect()
    gateway.nextPoll = "slow_down"
    await vi.advanceTimersByTimeAsync(5000)
    await vi.advanceTimersByTimeAsync(9000)
    expect(gateway.calls.filter((c) => c.startsWith("poll"))).toEqual(["poll:5"])
    await vi.advanceTimersByTimeAsync(1000)
    expect(gateway.calls.filter((c) => c.startsWith("poll"))).toEqual(["poll:5", "poll:10"])
  })

  it("stops when Simkl says the code expired", async () => {
    const { gateway, connection } = setup(null)
    await connection.connect()
    gateway.nextPoll = "expired"
    await vi.advanceTimersByTimeAsync(5000)
    expect(connection.state).toMatchObject({ kind: "disconnected", note: /expired/ })
  })

  it("stops polling when the code expires or the card goes away", async () => {
    const { gateway, connection } = setup(null)
    await connection.connect()
    await vi.advanceTimersByTimeAsync(900_000)
    expect(connection.state).toMatchObject({ kind: "disconnected", note: /expired/ })
    const polls = gateway.calls.length
    await connection.connect()
    connection.dispose()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(gateway.calls.length).toBe(polls + 1)
  })

  it("syncs now, recording the new time, and disconnects", async () => {
    const { gateway, connection } = setup(LINK)
    await connection.load()
    await connection.syncNow()
    expect(connection.state).toMatchObject({ kind: "connected", note: "Nothing new from Simkl" })
    if (connection.state.kind === "connected")
      expect(connection.state.link.lastSyncedAt).toBe(gateway.syncedAt)
    await connection.disconnect()
    expect(connection.state).toEqual({ kind: "disconnected" })
  })

  it("keeps the reason when a call fails", async () => {
    const { gateway, connection } = setup(LINK)
    gateway.failNext = true
    await connection.load()
    expect(connection.state).toEqual({ kind: "failed", message: "Simkl is down" })
    await connection.load()
    gateway.failNext = true
    await connection.syncNow()
    expect(connection.state).toMatchObject({ kind: "connected", note: "Simkl is down" })
  })
})
