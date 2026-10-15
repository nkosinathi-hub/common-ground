import { describe, expect, it } from "vitest"
import { checkVersions, parseMise, satisfies } from "./versions"

const MISE = '[tools]\nnode = "24"\n"npm:pnpm" = "10.34.3"\n'

describe("toolchain versions", () => {
  it("reads node and pnpm from .mise.toml", () => {
    expect(parseMise(MISE)).toEqual({ node: "24", pnpm: "10.34.3" })
  })

  it("accepts the same major at or above the pinned version", () => {
    expect(satisfies("v24.18.0", "24")).toBe(true)
    expect(satisfies("10.34.3", "10.34.3")).toBe(true)
    expect(satisfies("10.40.0", "10.34.3")).toBe(true)
  })

  it("rejects another major or an older release", () => {
    expect(satisfies("v22.11.0", "24")).toBe(false)
    expect(satisfies("11.0.0", "10.34.3")).toBe(false)
    expect(satisfies("10.2.0", "10.34.3")).toBe(false)
  })

  it("explains every mismatch", () => {
    const required = parseMise(MISE)
    expect(checkVersions({ node: "v24.1.0", pnpm: "10.34.3" }, required)).toEqual([])
    expect(checkVersions({ node: "v20.0.0", pnpm: "9.0.0" }, required)).toEqual([
      "node v20.0.0 does not satisfy 24 (run: mise install)",
      "pnpm 9.0.0 does not satisfy 10.34.3 (run: mise install)",
    ])
  })
})
