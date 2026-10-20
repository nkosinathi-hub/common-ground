import { describe, expect, it } from "vitest"
import { DAY, at, connected, setup } from "./service-fixture.ts"
import { tokenReply } from "./stub-simkl.ts"

const UNAUTHORIZED = { status: 401, body: { error: "invalid_token" } }
const OK_ACTIVITIES = { status: 200, body: { all: "2026-02-01T00:00:00Z" } }

const linked = (validMs: number) => {
  const context = setup()
  context.store.rows.set("u1", connected(validMs, "2026-02-01T00:00:00Z"))
  context.stub.reply("POST /oauth2/token", { status: 200, body: tokenReply() })
  return context
}

const bearers = (context: ReturnType<typeof setup>) =>
  context.stub.sent("GET /sync/activities").map((r) => r.headers.get("authorization"))

describe("simkl tokens", () => {
  it("uses the stored access token while it has more than a day left", async () => {
    const context = linked(2 * DAY)
    await context.service.sync("u1")
    expect(context.stub.sent("POST /oauth2/token")).toEqual([])
    expect(bearers(context)).toEqual(["Bearer simkl_at_old"])
  })

  it("refreshes within a day of expiry, stores the new token and releases the lease", async () => {
    const context = linked(DAY / 2)
    expect(await context.service.sync("u1")).toMatchObject({ ok: true })
    expect(Object.fromEntries(context.stub.sent("POST /oauth2/token")[0]?.form ?? [])).toEqual({
      client_id: "cid",
      grant_type: "refresh_token",
      refresh_token: "simkl_rt_one",
    })
    expect(bearers(context)).toEqual(["Bearer simkl_at_new"])
    expect(context.store.rows.get("u1")).toMatchObject({
      accessToken: "simkl_at_new",
      refreshToken: "simkl_rt_one",
      accessExpiresAt: at(7 * DAY),
      lease: false,
    })
  })

  it("refreshes once on a 401, then retries once", async () => {
    const context = linked(3 * DAY)
    context.stub.reply("GET /sync/activities", UNAUTHORIZED, OK_ACTIVITIES)
    expect(await context.service.sync("u1")).toMatchObject({ ok: true })
    expect(bearers(context)).toEqual(["Bearer simkl_at_old", "Bearer simkl_at_new"])
  })

  it("asks to connect again when the retry is refused too", async () => {
    const context = linked(3 * DAY)
    context.stub.reply("GET /sync/activities", UNAUTHORIZED)
    expect(await context.service.sync("u1")).toMatchObject({ ok: false, kind: "denied" })
    expect(context.stub.sent("POST /oauth2/token")).toHaveLength(1)
    expect(context.store.rows.has("u1")).toBe(false)
  })

  it.each([400, 401])("deletes the link when the refresh fails with %i", async (status) => {
    const context = linked(DAY / 2)
    context.stub.reply("POST /oauth2/token", { status, body: { error: "invalid_grant" } })
    expect(await context.service.sync("u1")).toMatchObject({ ok: false, kind: "denied" })
    expect(context.store.rows.has("u1")).toBe(false)
  })

  it("keeps a still valid token when a proactive refresh meets an outage", async () => {
    const context = linked(DAY / 2)
    context.stub.reply("POST /oauth2/token", { status: 503, body: {} })
    expect(await context.service.sync("u1")).toMatchObject({ ok: true })
    expect(bearers(context)).toEqual(["Bearer simkl_at_old"])
    expect(context.store.rows.get("u1")?.lease).toBe(false)
  })

  it("waits for another sync's refresh instead of refreshing over it", async () => {
    const context = linked(DAY / 2)
    const row = context.store.rows.get("u1")!
    row.lease = true
    context.store.onWait = () => Object.assign(row, { accessToken: "simkl_at_other", lease: false })
    expect(await context.service.sync("u1")).toMatchObject({ ok: true })
    expect(context.stub.sent("POST /oauth2/token")).toEqual([])
    expect(bearers(context)).toEqual(["Bearer simkl_at_other"])
    expect(context.sleeps.length).toBeGreaterThan(0)
  })
})
