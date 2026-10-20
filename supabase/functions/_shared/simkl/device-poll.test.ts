import { describe, expect, it } from "vitest"
import { NOT_CONFIGURED } from "./outcome.ts"
import { NOW, at, setup } from "./service-fixture.ts"
import { DEVICE, tokenReply } from "./stub-simkl.ts"

const started = async () => {
  const context = setup()
  await context.service.pin("u1")
  return context
}

describe("simkl device flow: polling", () => {
  it("polls with the stored device code and keeps waiting while pending", async () => {
    const { service, stub } = await started()
    expect(await service.poll("u1", 5)).toEqual({
      ok: true,
      body: { status: "pending", interval: 5 },
    })
    expect(Object.fromEntries(stub.sent("POST /oauth2/token")[0]?.form ?? [])).toEqual({
      client_id: "cid",
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: DEVICE.device_code,
    })
  })

  it("slows down by five seconds when Simkl asks", async () => {
    const { service, stub } = await started()
    stub.reply("POST /oauth2/token", { status: 400, body: { error: "slow_down" } })
    expect(await service.poll("u1", 5)).toEqual({
      ok: true,
      body: { status: "pending", interval: 10 },
    })
  })

  it("forgets an expired code, from Simkl or by its own clock", async () => {
    const { service, stub, store } = await started()
    stub.reply("POST /oauth2/token", { status: 400, body: { error: "expired_token" } })
    expect(await service.poll("u1", 5)).toEqual({ ok: true, body: { status: "expired" } })
    expect(store.rows.get("u1")?.deviceCode).toBeNull()
    const late = await started()
    late.store.rows.get("u1")!.deviceExpiresAt = NOW.toISOString()
    expect(await late.service.poll("u1", 5)).toEqual({ ok: true, body: { status: "expired" } })
    expect(late.stub.sent("POST /oauth2/token")).toEqual([])
  })

  it("answers not set up when Simkl refuses the client", async () => {
    const { service, stub } = await started()
    stub.reply("POST /oauth2/token", { status: 401, body: { error: "invalid_client" } })
    expect(await service.poll("u1", 5)).toMatchObject({ ok: false, message: NOT_CONFIGURED })
  })

  it("stores both tokens and the access expiry once approved, and clears the code", async () => {
    const { service, stub, store } = await started()
    stub.reply("POST /oauth2/token", { status: 200, body: tokenReply() })
    expect(await service.poll("u1", 5)).toEqual({ ok: true, body: { status: "connected" } })
    expect(store.rows.get("u1")).toMatchObject({
      accessToken: "simkl_at_new",
      refreshToken: "simkl_rt_one",
      accessExpiresAt: at(604_800_000),
      deviceCode: null,
      connected: true,
    })
  })

  it("refuses a grant without read access", async () => {
    const { service, stub, store } = await started()
    stub.reply("POST /oauth2/token", { status: 200, body: { ...tokenReply(), scope: "profile" } })
    expect(await service.poll("u1", 5)).toMatchObject({ ok: false, kind: "denied" })
    expect(store.rows.get("u1")?.accessToken).toBeNull()
  })
})
