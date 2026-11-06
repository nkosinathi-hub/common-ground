import { describe, expect, it, vi } from "vitest"
import { Plus } from "@lucide/svelte"
import { ActionInput } from "./action-input"

function setup() {
  let open = false
  const onclick = vi.fn(),
    activate = vi.fn(),
    reveal = vi.fn(() => {
      open = true
    })
  const input = new ActionInput({
    action: () => ({ label: "Add title", icon: Plus, onclick }),
    open: () => open,
    reveal,
    activate,
  })
  return { input, onclick, activate, reveal }
}
describe("route action activation", () => {
  it("runs the primary action on the first touch without opening navigation", () => {
    const { input, reveal, onclick, activate } = setup()
    input.click(new MouseEvent("click"))
    expect(reveal).not.toHaveBeenCalled()
    expect(onclick).toHaveBeenCalledOnce()
    expect(activate).toHaveBeenCalledOnce()
  })
  it("runs the primary action immediately with a mouse or desktop keyboard", () => {
    const { input, reveal, onclick } = setup()
    input.click(new MouseEvent("click"))
    expect(onclick).toHaveBeenCalledOnce()
    expect(reveal).not.toHaveBeenCalled()
  })
  it("prevents compatibility mouse focus when handling a touch directly", () => {
    const { input, onclick, reveal } = setup()
    const preventDefault = vi.fn()
    const target = document.createElement("button")
    target.setPointerCapture = vi.fn()
    input.down({
      pointerType: "touch",
      isPrimary: true,
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      preventDefault,
      currentTarget: target,
    } as unknown as PointerEvent)
    expect(preventDefault).toHaveBeenCalledOnce()
    input.cancel()
    input.click(new MouseEvent("click", { detail: 1 }))
    expect(reveal).not.toHaveBeenCalled()
    expect(onclick).not.toHaveBeenCalled()
  })
})

it("opens a touch action once and captures its compatibility click before a modal can dismiss", () => {
  const { input, onclick, reveal } = setup()
  const target = document.createElement("button")
  target.setPointerCapture = vi.fn()
  const event = {
    pointerType: "touch",
    isPrimary: true,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    preventDefault: vi.fn(),
    currentTarget: target,
  } as unknown as PointerEvent
  input.down(event)
  input.up(event)
  expect(onclick).toHaveBeenCalledOnce()
  const click = new MouseEvent("click", { detail: 1, cancelable: true })
  const stop = vi.spyOn(click, "stopImmediatePropagation")
  input.compatibilityClick(click)
  expect(click.defaultPrevented).toBe(true)
  expect(stop).toHaveBeenCalledOnce()
  input.click(click)
  expect(onclick).toHaveBeenCalledOnce()
  input.outsideDown()
  expect(reveal).not.toHaveBeenCalled()
})
