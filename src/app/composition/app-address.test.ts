import { describe, expect, it } from "vitest"
import { appAddress } from "./app-address"

describe("appAddress", () => {
  it("sends the website's email links to itself, so the app never claims them", () => {
    expect(appAddress(undefined, "https://cg.example", "/common-ground/")).toMatchObject({
      origin: "https://cg.example",
      basePath: "/common-ground/",
    })
  })

  it("shares invites through the app-link page, which opens the app when it is installed", () => {
    expect(appAddress(undefined, "https://cg.example", "/common-ground/").url).toBe(
      "https://cg.example/common-ground/app-link/",
    )
  })

  it("sends the Android app's email links to the app-link page, never https://localhost", () => {
    const address = appAddress(
      "https://nkosinathi-hub.github.io/common-ground/",
      "https://localhost",
      "/",
    )
    expect(address).toEqual({
      origin: "https://nkosinathi-hub.github.io",
      basePath: "/common-ground/app-link/",
      url: "https://nkosinathi-hub.github.io/common-ground/app-link/",
    })
  })

  it("adds the trailing slash a base path needs", () => {
    expect(appAddress("https://cg.example/app", "https://localhost", "/").url).toBe(
      "https://cg.example/app/app-link/",
    )
  })

  it("treats an empty value as unset", () => {
    expect(appAddress("", "http://127.0.0.1:5173", "/").basePath).toBe("/")
  })

  it("refuses a public URL that is not plain https", () => {
    expect(() => appAddress("http://cg.example/", "https://localhost", "/")).toThrow(/https/)
    expect(() => appAddress("https://cg.example/?x=1", "https://localhost", "/")).toThrow(/https/)
  })
})
