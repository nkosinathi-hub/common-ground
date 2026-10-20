import { describe, expect, it } from "vitest"
import { appError } from "../../../shared/domain/result"
import { defaultClassify, timeoutError } from "./errors"

describe("defaultClassify", () => {
  it.each([
    ["network", "transient"],
    ["rate_limited", "transient"],
    ["unknown", "transient"],
    ["unauthenticated", "auth"],
    ["denied", "auth"],
    ["not_found", "permanent"],
    ["validation", "permanent"],
    ["conflict", "permanent"],
  ] as const)("treats %s as %s", (kind, expected) => {
    expect(defaultClassify(appError(kind, "x"))).toBe(expected)
  })

  it("names a timeout as a transient network error", () => {
    expect(timeoutError(500)).toEqual({ kind: "network", message: "Timed out after 500 ms" })
    expect(defaultClassify(timeoutError(500))).toBe("transient")
  })
})
