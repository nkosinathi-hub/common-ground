import { describe, expect, it } from "vitest"
import { ok } from "@/shared/domain"
import { MemoryCredentials } from "@/features/playback/testing/fake-plugin"
import { composePlayback, playbackPlugins } from "./playback"
import { fixtureBuild } from "./playback-fixture"

describe("the end-to-end media fixture", () => {
  it("joins the plugins only when an end-to-end build names a loopback server", () => {
    expect(playbackPlugins({}).map((p) => p.type)).not.toContain("fixture")
    const build = fixtureBuild("http://127.0.0.1:4391")
    expect(playbackPlugins(build).map((p) => p.type)).toContain("fixture")
  })

  it("refuses any origin but this machine, so it can never play from elsewhere", () => {
    for (const origin of [
      "https://cdn.example.org",
      "http://192.168.1.5:4391",
      "http://localhost.evil.org",
    ])
      expect(() => fixtureBuild(origin)).toThrow(/loopback/)
    expect(fixtureBuild(undefined)).toEqual({})
    expect(fixtureBuild("")).toEqual({})
  })

  it("registers in an end-to-end build without refusing any provider", () => {
    const playback = composePlayback({
      build: fixtureBuild("http://127.0.0.1:4391"),
      credentials: new MemoryCredentials(),
      tmdb: { imdbId: async () => ok(null), videos: async () => ok([]) },
      choices: null,
    })
    expect(playback.refused).toEqual([])
  })
})
