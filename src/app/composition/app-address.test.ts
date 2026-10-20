import { describe, expect, it } from "vitest"
import { appAddress } from "./app-address"

describe("appAddress", () => {
  it("is where the page is served when no public URL is configured", () => {
    expect(appAddress(undefined, "https://cg.example", "/common-ground/")).toEqual({
      origin: "https://cg.example",
      basePath: "/common-ground/",
      url: "https://cg.example/common-ground/",
    })
  })

  it("is the public website inside the Android app, never https://localhost", () => {
    const address = appAddress(
      "https://nkosinathi-hub.github.io/common-ground/",
      "https://localhost",
      "/",
    )
    expect(address).toEqual({
      origin: "https://nkosinathi-hub.github.io",
      basePath: "/common-ground/",
      url: "https://nkosinathi-hub.github.io/common-ground/",
    })
  })

  it("adds the trailing slash a base path needs", () => {
    expect(appAddress("https://cg.example/app", "https://localhost", "/").url).toBe(
      "https://cg.example/app/",
    )
  })

  it("treats an empty value as unset", () => {
    expect(appAddress("", "http://127.0.0.1:5173", "/").url).toBe("http://127.0.0.1:5173/")
  })

  it("refuses a public URL that is not plain https", () => {
    expect(() => appAddress("http://cg.example/", "https://localhost", "/")).toThrow(/https/)
    expect(() => appAddress("https://cg.example/?x=1", "https://localhost", "/")).toThrow(/https/)
  })
})
