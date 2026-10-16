import { describe, expect, it } from "vitest"
import { appError } from "@/shared/domain"
import { current, done, removed, same, settle, signedOut, touched } from "./query"

describe("query helpers", () => {
  it("settles data or maps the error", async () => {
    expect(await settle(Promise.resolve({ data: [1, 2], error: null }), (d) => d.length)).toEqual({
      ok: true,
      value: 2,
    })
    const failed = await settle(Promise.resolve({ data: null, error: { code: "42501" } }), () => 0)
    expect(failed.ok ? null : failed.error.kind).toBe("denied")
  })

  it("reports writes and refused deletes", async () => {
    expect((await done(Promise.resolve({ error: null }))).ok).toBe(true)
    expect((await removed(Promise.resolve({ data: [], error: null }))).ok).toBe(false)
    expect((await removed(Promise.resolve({ data: [{ id: "x" }], error: null }))).ok).toBe(true)
    expect(signedOut()).toMatchObject({ ok: false, error: { kind: "unauthenticated" } })
  })

  it("maps the row an optimistic update returned, or reports it went stale", async () => {
    const reply = (data: { n: number }[] | null, error: { code: string } | null = null) =>
      Promise.resolve({ data, error })
    const double = (row: { n: number }) => row.n * 2
    expect(await current(reply([{ n: 2 }]), double)).toEqual({ ok: true, value: 4 })
    expect(await current(reply([]), double)).toEqual({
      ok: false,
      error: {
        kind: "conflict",
        message: "Someone else changed this. Reload to see their version",
      },
    })
    const denied = await current(reply(null, { code: "42501" }), double)
    expect(denied.ok ? null : denied.error.kind).toBe("denied")
  })

  it("reports an update that touched no row with the caller's error", async () => {
    const gone = appError("not_found", "Gone")
    const reply = (data: { id: string }[] | null, error: { code: string } | null = null) =>
      Promise.resolve({ data, error })
    expect(await touched(reply([{ id: "a" }]), gone)).toEqual({ ok: true, value: undefined })
    expect(await touched(reply([]), gone)).toEqual({ ok: false, error: gone })
    const denied = await touched(reply(null, { code: "42501" }), gone)
    expect(denied.ok ? null : denied.error.kind).toBe("denied")
  })

  it("passes data through unchanged with same", async () => {
    expect(await settle(Promise.resolve({ data: "id-1", error: null }), same)).toEqual({
      ok: true,
      value: "id-1",
    })
  })
})
