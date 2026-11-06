import { afterEach, describe, expect, it, vi } from "vitest"
import { FanDrag } from "./fan-drag"

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
})
const point = (x = 100, id = 1) =>
  ({ pointerType: "touch", pointerId: id, clientX: x, clientY: 200 }) as PointerEvent
function setup() {
  vi.useFakeTimers()
  const root = document.createElement("nav"),
    anchor = document.createElement("button")
  const route = document.createElement("button")
  route.className = "fan-route"
  route.setAttribute("aria-label", "Watch")
  root.append(anchor, route)
  document.body.append(root)
  const click = vi.fn(),
    select = vi.fn(),
    active = vi.fn()
  route.onclick = click
  let hit: Element | null = route
  const drag = new FanDrag(
    () => anchor,
    { select, active },
    () => hit,
  )
  return {
    root,
    anchor,
    route,
    click,
    select,
    active,
    drag,
    hit: (element: Element | null) => {
      hit = element
    },
  }
}

describe("hold and drag fan selection", () => {
  it("highlights the item under the finger and activates only on release", () => {
    const { root, anchor, route, click, select, active, drag } = setup()
    drag.start(point())
    expect(anchor).toHaveAttribute("data-holding")
    drag.begin()
    drag.move(point())
    expect(root).toHaveAttribute("data-dragging")
    expect(route).toHaveAttribute("data-drag-selected")
    expect(select).toHaveBeenLastCalledWith("Watch")
    expect(click).not.toHaveBeenCalled()
    expect(drag.finish(point())).toBe(true)
    expect(click).toHaveBeenCalledOnce()
    expect(route).not.toHaveAttribute("data-drag-selected")
    expect(root).not.toHaveAttribute("data-dragging")
    expect(active).toHaveBeenLastCalledWith(false)
  })

  it("cancels outside, on pointer cancellation, and for disabled entries", () => {
    const { route, click, drag, hit } = setup()
    drag.start(point())
    drag.begin()
    hit(null)
    expect(drag.finish(point())).toBe(true)
    expect(click).not.toHaveBeenCalled()
    hit(route)
    drag.start(point())
    drag.begin()
    drag.cancel()
    expect(drag.finish(point())).toBe(false)
    route.disabled = true
    drag.start(point())
    drag.begin()
    drag.finish(point())
    expect(click).not.toHaveBeenCalled()
  })

  it("keeps ordinary taps and ignores another finger", () => {
    const { drag, route, click } = setup()
    drag.start(point())
    expect(drag.finish(point())).toBe(false)
    drag.start(point())
    drag.begin()
    expect(drag.finish(point(100, 2))).toBe(false)
    expect(route).toHaveAttribute("data-drag-selected")
    expect(drag.finish(point())).toBe(true)
    expect(click).toHaveBeenCalledOnce()
  })
})
