import { describe, expect, it } from "vitest"
import { settleAuth } from "./auth-errors"

const reply = (error: object | null) => Promise.resolve({ data: {}, error })

describe("settleAuth", () => {
  it("words the auth codes a person can act on", async () => {
    expect(await settleAuth(reply({ code: "weak_password", status: 422 }))).toMatchObject({
      error: { kind: "validation", field: "password" },
    })
    expect(await settleAuth(reply({ code: "same_password", status: 422 }))).toMatchObject({
      error: { kind: "validation", field: "password" },
    })
    const limited = await settleAuth(reply({ code: "over_email_send_rate_limit", status: 429 }))
    expect(limited).toMatchObject({ error: { kind: "rate_limited" } })
  })

  it("maps other failures like any server error, and passes success through", async () => {
    expect(await settleAuth(reply({ status: 503 }))).toMatchObject({ error: { kind: "network" } })
    expect(await settleAuth(reply(null))).toEqual({ ok: true, value: undefined })
  })
})
