import { describe, expect, it } from "vitest"
import { err, isOk, map, ok } from "./result"

describe("Result", () => {
  it("wraps success and failure", () => {
    expect(isOk(ok(1))).toBe(true)
    expect(isOk(err({ kind: "network", message: "down" }))).toBe(false)
  })

  it("maps only successes", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual(ok(4))
    const failure = err({ kind: "denied", message: "no" } as const)
    expect(map(failure, (n: number) => n * 2)).toBe(failure)
  })
})
