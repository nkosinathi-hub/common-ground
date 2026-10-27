import { describe, expect, it, vi } from "vitest"
import { ok } from "../../../shared/domain/result"
import type { Provider } from "../domain/provider.types"
import { fakeSource } from "../testing/fake-plugin"
import { ProgressReporter } from "./progress-reporter"

function setup(withReport = true) {
  let now = 0
  const report = vi.fn(async () => {})
  const provider = {
    id: "a",
    supports: () => true,
    resolve: async () => ok([]),
    health: async () => ok(undefined),
    ...(withReport ? { report } : {}),
  } satisfies Provider
  const markWatched = vi.fn(async () => ok(undefined))
  const reporter = new ProgressReporter({
    source: fakeSource("a", "a"),
    provider,
    watched: markWatched,
    clock: () => now,
  })
  return { reporter, report, markWatched, advance: (ms: number) => (now += ms) }
}

describe("ProgressReporter", () => {
  it("reports start, then progress at most every 10 seconds, then stop with keepalive", async () => {
    const { reporter, report, advance } = setup()
    await reporter.start(0)
    advance(5_000)
    await reporter.tick(5, 100, false)
    advance(5_000)
    await reporter.tick(10, 100, false)
    await reporter.stop(11, true)
    const kinds = report.mock.calls.map((c) => {
      const event = (c as unknown[])[0] as { kind: string; keepalive: boolean }
      return [event.kind, event.keepalive]
    })
    expect(kinds).toEqual([
      ["start", false],
      ["progress", false],
      ["stop", true],
    ])
  })

  it("marks watched once, at 90 percent", async () => {
    const { reporter, markWatched } = setup(false)
    await reporter.tick(80, 100, false)
    expect(markWatched).not.toHaveBeenCalled()
    await reporter.tick(90, 100, false)
    await reporter.tick(95, 100, false)
    expect(markWatched).toHaveBeenCalledTimes(1)
  })

  it("updates the owning view after the watched mark succeeds", async () => {
    const marked = vi.fn()
    const reporter = new ProgressReporter({
      source: fakeSource("a", "a"),
      watched: async () => ok(undefined),
      onWatched: marked,
      clock: () => 0,
    })
    await reporter.tick(90, 100, false)
    await reporter.tick(95, 100, false)
    expect(marked).toHaveBeenCalledTimes(1)
  })

  it("never lets a failing report stop playback", async () => {
    const { reporter, report } = setup()
    report.mockRejectedValue(new Error("offline"))
    await expect(reporter.start(0)).resolves.toBeUndefined()
  })
})
