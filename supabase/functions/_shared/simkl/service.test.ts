import { describe, expect, it } from "vitest"
import { connected, setup } from "./service-fixture.ts"

describe("simkl disconnect", () => {
  it("revokes the grant with the refresh token, then forgets the link", async () => {
    const { service, store, stub } = setup()
    store.rows.set("u1", connected())
    expect(await service.disconnect("u1")).toEqual({ ok: true, body: { connected: false } })
    expect(stub.sent("POST /oauth2/revoke")[0]?.form?.get("token")).toBe("simkl_rt_one")
    expect(store.rows.has("u1")).toBe(false)
  })

  it("forgets the link even when the revoke fails", async () => {
    const { service, store, stub } = setup()
    store.rows.set("u1", connected())
    stub.reply("POST /oauth2/revoke", { status: 500, body: {} })
    expect(await service.disconnect("u1")).toMatchObject({ ok: true })
    expect(store.rows.has("u1")).toBe(false)
  })

  it("forgets a pending sign-in without calling Simkl", async () => {
    const { service, store, stub } = setup()
    await service.pin("u1")
    await service.disconnect("u1")
    expect(stub.sent("POST /oauth2/revoke")).toEqual([])
    expect(store.rows.has("u1")).toBe(false)
  })
})
