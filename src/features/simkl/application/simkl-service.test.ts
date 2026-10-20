import { describe, expect, it } from "vitest"
import { FakeSimklGateway } from "../testing/fake-simkl-gateway"
import { SimklService } from "./simkl-service"

const LINK = { connectedAt: "2026-03-01T10:00:00Z", lastSyncedAt: null }

describe("SimklService", () => {
  it("passes the connect, poll, sync and disconnect calls through", async () => {
    const gateway = new FakeSimklGateway()
    const service = new SimklService(gateway)
    expect(await service.status()).toEqual({ ok: true, value: null })
    expect(await service.startPin()).toMatchObject({ ok: true, value: { userCode: "ABCD-EFGH" } })
    expect(await service.poll(5)).toEqual({ ok: true, value: { status: "pending", interval: 5 } })
    gateway.approve(LINK)
    expect(await service.poll(5)).toEqual({ ok: true, value: { status: "connected" } })
    expect(await service.sync()).toMatchObject({ ok: true, value: { added: 0 } })
    expect(await service.disconnect()).toEqual({ ok: true, value: undefined })
    expect(gateway.calls).toEqual(["status", "pin", "poll:5", "poll:5", "sync", "disconnect"])
  })

  it("syncs once per app open, and only when connected", async () => {
    const gateway = new FakeSimklGateway(LINK)
    const service = new SimklService(gateway)
    await service.syncOnOpen("u1")
    await service.syncOnOpen("u1")
    expect(gateway.calls).toEqual(["status", "sync"])
  })

  it("syncs again on the same open for a different person", async () => {
    const gateway = new FakeSimklGateway(LINK)
    const service = new SimklService(gateway)
    await service.syncOnOpen("u1")
    await service.syncOnOpen("u2")
    expect(gateway.calls.filter((c) => c === "sync")).toHaveLength(2)
  })

  it("does nothing when Simkl is not connected or the status is unreachable", async () => {
    const gateway = new FakeSimklGateway()
    await new SimklService(gateway).syncOnOpen("u1")
    gateway.failNext = true
    await new SimklService(gateway).syncOnOpen("u1")
    expect(gateway.calls).toEqual(["status", "status"])
  })
})
