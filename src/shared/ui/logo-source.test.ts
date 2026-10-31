// @vitest-environment node
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8")
const paths = (svg: string) => [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1])

describe("one logo", () => {
  const source = read("../../assets/logo.svg")

  it("draws the same mark in the app as in every generated icon", () => {
    expect(paths(read("./Logo.svelte"))).toEqual(paths(source))
    expect(paths(source)).toHaveLength(2)
  })

  it("serves the logo itself as the favicon", () => {
    expect(read("../../../public/icon.svg")).toBe(source)
  })
})
