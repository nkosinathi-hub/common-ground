import { afterEach, expect, it, vi } from "vitest"
import { fileSource } from "../testing/render-player"
import { sourceExpiry } from "./source-expiry"
afterEach(() => vi.useRealTimers())
it("renews advertised links before expiry and cancels the timer on close", () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-11-06T10:00:00Z"))
  const renew = vi.fn()
  const source = fileSource("https://example.org/video", { expiresAt: "2026-11-06T10:01:00Z" })
  const dispose = sourceExpiry(source, renew)
  vi.advanceTimersByTime(55_000)
  expect(renew).toHaveBeenCalledOnce()
  dispose?.()
  const cancel = sourceExpiry(source, renew)
  cancel?.()
  vi.advanceTimersByTime(60_000)
  expect(renew).toHaveBeenCalledOnce()
  expect(sourceExpiry(null, renew)).toBeUndefined()
})
