import { afterEach, describe, expect, it, vi } from "vitest"
import { FanGesture } from "./fan-gesture"
const down = (x = 100, y = 200) =>
  ({
    pointerType: "touch",
    isPrimary: true,
    pointerId: 1,
    clientX: x,
    clientY: y,
    currentTarget: { setPointerCapture: vi.fn() },
  }) as unknown as PointerEvent
const move = (x: number, y: number) => ({ clientX: x, clientY: y }) as PointerEvent
afterEach(() => vi.useRealTimers())

describe("one-button navigation gestures", () => {
  it("keeps a tap for the primary action", () => {
    vi.useFakeTimers()
    const reveal = vi.fn(),
      gesture = new FanGesture(reveal)
    gesture.down(down())
    vi.advanceTimersByTime(100)
    gesture.cancel()
    vi.advanceTimersByTime(500)
    expect(reveal).not.toHaveBeenCalled()
    expect(gesture.consume()).toBe(false)
  })
  it("reveals on hold and suppresses the resulting click exactly once", () => {
    vi.useFakeTimers()
    const reveal = vi.fn(),
      gesture = new FanGesture(reveal)
    gesture.down(down())
    vi.advanceTimersByTime(450)
    expect(reveal).toHaveBeenCalledOnce()
    gesture.cancel()
    expect(gesture.consume()).toBe(true)
    expect(gesture.consume()).toBe(false)
  })
  it("reveals on upward swipe but cancels sideways gestures", () => {
    vi.useFakeTimers()
    const reveal = vi.fn(),
      gesture = new FanGesture(reveal)
    gesture.down(down())
    gesture.move(move(100, 170))
    expect(reveal).toHaveBeenCalledOnce()
    expect(gesture.consume()).toBe(true)
    gesture.down(down())
    gesture.move(move(125, 200))
    vi.advanceTimersByTime(500)
    expect(reveal).toHaveBeenCalledOnce()
    expect(gesture.consume()).toBe(false)
  })
  it("activates on release inside, and cancels release outside or after a swipe", () => {
    vi.useFakeTimers()
    const gesture = new FanGesture(vi.fn())
    const release = (x: number, y: number) =>
      ({
        clientX: x,
        clientY: y,
        currentTarget: {
          getBoundingClientRect: () => ({ left: 80, top: 180, right: 120, bottom: 220 }),
        },
      }) as unknown as PointerEvent
    gesture.down(down())
    expect(gesture.finish(release(100, 200))).toBe(true)
    gesture.down(down())
    expect(gesture.finish(release(130, 200))).toBe(false)
    gesture.down(down())
    gesture.move(move(100, 170))
    expect(gesture.finish(release(100, 200))).toBe(false)
  })
})
