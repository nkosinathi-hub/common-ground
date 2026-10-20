import { describe, expect, it } from "vitest"
import { isNewer, parseRelease } from "./update"

describe("isNewer", () => {
  it("compares versions part by part, as numbers", () => {
    expect(isNewer("0.4.1", "0.4.0")).toBe(true)
    expect(isNewer("0.10.0", "0.9.9")).toBe(true)
    expect(isNewer("1.0.0", "0.99.99")).toBe(true)
  })

  it("is false for the same or an older version", () => {
    expect(isNewer("0.4.0", "0.4.0")).toBe(false)
    expect(isNewer("0.3.9", "0.4.0")).toBe(false)
  })

  it("is false for anything that is not a version", () => {
    expect(isNewer("latest", "0.4.0")).toBe(false)
    expect(isNewer("0.5", "0.4.0")).toBe(false)
  })
})

describe("parseRelease", () => {
  const site = "https://nkosinathi-hub.github.io/common-ground/"

  it("reads the published version and resolves the APK next to it", () => {
    expect(parseRelease({ version: "0.4.1", apk: "common-ground.apk" }, `${site}app/`)).toEqual({
      version: "0.4.1",
      apk: `${site}app/common-ground.apk`,
    })
  })

  it("refuses an APK hosted anywhere but the website", () => {
    expect(parseRelease({ version: "0.4.1", apk: "https://evil.example/x.apk" }, site)).toBeNull()
  })

  it("refuses a malformed file", () => {
    expect(parseRelease({ version: 4 }, site)).toBeNull()
    expect(parseRelease(null, site)).toBeNull()
  })
})
