import { describe, expect, it } from "vitest"
import { appError, err, ok, type Result } from "@/shared/domain"
import { MediaUrls } from "./media-urls"

function setup() {
  let now = 0
  const asked: string[][] = []
  let reply: (paths: readonly string[]) => Result<Record<string, string>> = (paths) =>
    ok(Object.fromEntries(paths.map((p) => [p, `${p}?t=${now}`])))
  const urls = new MediaUrls(
    async (paths) => (asked.push([...paths]), reply(paths)),
    () => now,
  )
  return {
    urls,
    asked,
    at: (ms: number) => (now = ms),
    fail: () => (reply = () => err(appError("network", "down"))),
  }
}

describe("MediaUrls", () => {
  it("signs each path once, in one batch, and reuses it while fresh", async () => {
    const { urls, asked, at } = setup()
    expect(await urls.resolve(["a", null, "b", "a"])).toEqual({ a: "a?t=0", b: "b?t=0" })
    at(10 * 60_000)
    expect(await urls.resolve(["a", "c"])).toEqual({ a: "a?t=0", c: "c?t=600000" })
    expect(asked).toEqual([["a", "b"], ["c"]])
  })

  it("signs again before the hour runs out", async () => {
    const { urls, asked, at } = setup()
    await urls.resolve(["a"])
    at(51 * 60_000)
    expect(await urls.resolve(["a"])).toEqual({ a: "a?t=3060000" })
    expect(asked).toHaveLength(2)
  })

  it("asks for nothing when there is nothing to show, and survives a failed batch", async () => {
    const { urls, asked, fail } = setup()
    expect(await urls.resolve([null])).toEqual({})
    expect(asked).toEqual([])
    fail()
    expect(await urls.resolve(["a"])).toEqual({})
  })
})
