import { describe, expect, it } from "vitest"
import { centreCrop, fitWithin, MEDIA_SIZE, mediaPath } from "./media"

describe("space media", () => {
  it("shrinks to fit a box, keeping the shape, and never enlarges", () => {
    expect(fitWithin(4000, 2000, 1800)).toEqual({ width: 1800, height: 900 })
    expect(fitWithin(1000, 3000, 512)).toEqual({ width: 171, height: 512 })
    expect(fitWithin(300, 200, 512)).toEqual({ width: 300, height: 200 })
  })

  it("crops the centre to the slot's shape", () => {
    expect(centreCrop(1000, 500, 1)).toEqual({ x: 250, y: 0, width: 500, height: 500 })
    expect(centreCrop(900, 900, 3)).toEqual({ x: 0, y: 300, width: 900, height: 300 })
    expect(centreCrop(600, 200, 3)).toEqual({ x: 0, y: 0, width: 600, height: 200 })
  })

  it("sizes avatars square and covers wide", () => {
    expect(MEDIA_SIZE.avatar).toEqual({ width: 512, height: 512 })
    expect(MEDIA_SIZE.cover).toEqual({ width: 1800, height: 600 })
  })

  it("names every upload freshly under its space and slot", () => {
    expect(mediaPath("s1", "cover", "u1")).toBe("s1/cover/u1.webp")
  })
})
