import { describe, expect, it } from "vitest"
import { removed, settle } from "./query"

const reply = (data: unknown, error: { code?: string; message?: string } | null = null) =>
  Promise.resolve({ data, error })

describe("settle", () => {
  it("maps data on success and errors to AppError", async () => {
    expect(await settle(reply({ n: 2 }), (row) => (row as { n: number }).n * 2)).toEqual({
      ok: true,
      value: 4,
    })
    const failed = await settle(reply(null, { code: "42501", message: "rls" }), () => 0)
    expect(failed.ok ? null : failed.error.kind).toBe("denied")
  })
})

describe("removed", () => {
  it("succeeds only when a row was actually deleted", async () => {
    expect(await removed(reply([{ id: "a" }]))).toEqual({ ok: true, value: undefined })
  })

  it("reports a silent RLS refusal (no rows) as denied", async () => {
    const result = await removed(reply([]))
    expect(result.ok ? null : result.error).toMatchObject({ kind: "denied" })
    expect(result.ok ? "" : result.error.message).toMatch(/author or the space owner/)
  })

  it("passes through database errors", async () => {
    const result = await removed(reply(null, { code: "23503", message: "fk" }))
    expect(result.ok ? null : result.error.kind).toBe("validation")
  })
})
