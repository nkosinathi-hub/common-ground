import { describe, expect, it } from "vitest"
import { ok, setup } from "./service-fixture.ts"

describe("simkl service: connecting", () => {
  it("starts a PIN with the code, the link, and how long to poll", async () => {
    expect(await setup().service.pin()).toEqual({
      ok: true,
      body: {
        userCode: "ABCDE",
        verificationUrl: "https://simkl.com/pin",
        expiresIn: 900,
        interval: 5,
      },
    })
  })

  it("never sends the user to a link off simkl.com", async () => {
    const startPin = async () => ok({ user_code: "X1", verification_url: "https://evil.test" })
    const reply = await setup({ startPin }).service.pin()
    expect(reply.ok && reply.body.verificationUrl).toBe("https://simkl.com/pin")
  })

  it("answers unavailable when Simkl gives no code", async () => {
    const reply = await setup({ startPin: async () => ok({ result: "KO" }) }).service.pin()
    expect(reply).toMatchObject({ ok: false, kind: "unavailable" })
  })

  it("keeps waiting while the code is pending, then stores the token", async () => {
    const { service, store, script } = setup()
    expect(await service.poll("u1", "ABCDE")).toEqual({ ok: true, body: { connected: false } })
    expect(store.rows.size).toBe(0)
    script.pollPin = ok({ result: "OK", access_token: "tok" })
    expect(await service.poll("u1", "ABCDE")).toEqual({ ok: true, body: { connected: true } })
    expect(store.rows.get("u1")).toEqual({ token: "tok", cursor: null, watches: [] })
  })

  it("disconnects by forgetting the link", async () => {
    const { service, store } = setup()
    store.rows.set("u1", { token: "t", cursor: null, watches: [] })
    expect(await service.disconnect("u1")).toEqual({ ok: true, body: { connected: false } })
    expect(store.rows.has("u1")).toBe(false)
  })
})
