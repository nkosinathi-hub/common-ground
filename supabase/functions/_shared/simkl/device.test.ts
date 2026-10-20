import { describe, expect, it } from "vitest"
import { NOT_CONFIGURED } from "./outcome.ts"
import { at, setup } from "./service-fixture.ts"
import { DEVICE } from "./stub-simkl.ts"

describe("simkl device flow: starting", () => {
  it("gives the browser the code and links, and keeps the device code server-side", async () => {
    const { service, store } = setup()
    const reply = await service.pin("u1")
    expect(reply).toEqual({
      ok: true,
      body: {
        userCode: "ABCD-EFGH",
        verificationUri: "https://simkl.com/pin",
        verificationUriComplete: "https://simkl.com/pin?user_code=ABCD-EFGH",
        interval: 5,
        expiresIn: 900,
      },
    })
    expect(JSON.stringify(reply)).not.toContain(DEVICE.device_code)
    expect(store.rows.get("u1")).toMatchObject({
      deviceCode: DEVICE.device_code,
      deviceExpiresAt: at(900_000),
      connected: false,
    })
  })

  it("never links the user off simkl.com", async () => {
    const { service, stub } = setup()
    stub.reply("POST /oauth2/device", {
      status: 200,
      body: { ...DEVICE, verification_uri_complete: "https://evil.test/pin" },
    })
    const reply = await service.pin("u1")
    expect(reply.ok && reply.body.verificationUriComplete).toBe("https://simkl.com/pin")
  })

  it("says plainly that a client id Simkl refuses is not set up", async () => {
    const { service, stub } = setup()
    stub.reply("POST /oauth2/device", { status: 401, body: { error: "invalid_client" } })
    expect(await service.pin("u1")).toMatchObject({ ok: false, message: NOT_CONFIGURED })
  })
})
