import { describe, expect, it } from "vitest"
import { fanContains } from "./fan-bounds"

describe("floating action hover corridor", () => {
  it("stays open through gaps between controls and closes outside its bounds", () => {
    const root = document.createElement("nav")
    root.getBoundingClientRect = () => new DOMRect(20, 100, 320, 200)
    const event = (clientX: number, clientY: number) => ({ clientX, clientY }) as PointerEvent
    expect(fanContains(root, event(180, 200))).toBe(true)
    expect(fanContains(root, event(20, 100))).toBe(true)
    expect(fanContains(root, event(10, 200))).toBe(false)
    expect(fanContains(root, event(180, 310))).toBe(false)
    expect(fanContains(undefined, event(180, 200))).toBe(false)
  })
})
