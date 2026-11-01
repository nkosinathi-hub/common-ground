import { afterEach, describe, expect, it, vi } from "vitest"
import { gatherSources } from "./gather-sources"
import { fakeSource } from "../testing/fake-plugin"

afterEach(() => vi.useRealTimers())
describe("responsive source gathering", () => {
  it("returns playable results and already-ready fallbacks without waiting for a hanging provider", async () => {
    vi.useFakeTimers()
    let pending: AbortSignal | undefined
    const source = fakeSource("a", "a")
    const result = gatherSources(
      [
        async () => [source],
        async () => [fakeSource("b", "b")],
        (signal) => {
          pending = signal
          return new Promise(() => {})
        },
      ],
      () => true,
    )
    await vi.advanceTimersByTimeAsync(400)
    expect(await result).toHaveLength(2)
    expect(pending?.aborted).toBe(true)
  })

  it("handles external cancellation and empty results without leaving a timer running", async () => {
    const parent = new AbortController()
    const result = gatherSources([() => new Promise(() => {})], () => true, parent.signal)
    parent.abort()
    expect(await result).toEqual([])
    expect(await gatherSources([], () => true)).toEqual([])
    expect(await gatherSources([async () => []], () => true)).toEqual([])
    expect(
      await gatherSources(
        [
          async () => {
            throw new Error("provider")
          },
        ],
        () => true,
      ),
    ).toEqual([])
  })
})
