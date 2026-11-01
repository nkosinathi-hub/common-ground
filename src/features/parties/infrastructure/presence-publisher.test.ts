import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { PresencePublisher } from "./presence-publisher"

const mine = { userId: "me", ready: false, buffering: false, joinedAt: "2026-11-01" }
beforeEach(() => vi.useFakeTimers().setSystemTime(1000))
afterEach(() => vi.useRealTimers())

it("deduplicates unchanged state and coalesces a rapid seek's buffering changes", () => {
  const send = vi.fn(),
    publisher = new PresencePublisher(send)
  publisher.track(mine)
  expect(send).not.toHaveBeenCalled()
  publisher.online(true)
  publisher.track(mine)
  publisher.online(true)
  for (let i = 0; i < 50; i++) {
    publisher.track({ ...mine, buffering: i % 2 !== 0 })
    vi.advanceTimersByTime(1)
  }
  expect(send).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(450)
  expect(send).toHaveBeenCalledTimes(2)
  expect(send).toHaveBeenLastCalledWith({ ...mine, buffering: true })
  publisher.close()
})

it("bounds continuous buffering transitions to two updates per second", () => {
  const send = vi.fn(),
    publisher = new PresencePublisher(send)
  publisher.online(true)
  for (let i = 0; i < 100; i++) {
    publisher.track({ ...mine, buffering: i % 2 === 0 })
    vi.advanceTimersByTime(10)
  }
  expect(send.mock.calls.length).toBeLessThanOrEqual(3)
  publisher.close()
})

it("retracks once after reconnect and cancels scheduled updates on leaving", () => {
  const send = vi.fn(),
    publisher = new PresencePublisher(send)
  publisher.track(mine)
  publisher.online(true)
  publisher.online(false)
  publisher.track({ ...mine, ready: true })
  vi.advanceTimersByTime(1000)
  expect(send).toHaveBeenCalledTimes(1)
  publisher.online(true)
  expect(send).toHaveBeenCalledTimes(2)
  publisher.track({ ...mine, buffering: true })
  publisher.close()
  vi.advanceTimersByTime(1000)
  expect(send).toHaveBeenCalledTimes(2)
})

it("publishes Ready immediately so playback commands follow readiness", () => {
  const send = vi.fn(),
    publisher = new PresencePublisher(send)
  publisher.online(true)
  publisher.track(mine)
  publisher.track({ ...mine, ready: true })
  expect(send).toHaveBeenLastCalledWith({ ...mine, ready: true })
  expect(send).toHaveBeenCalledTimes(2)
  publisher.close()
})
