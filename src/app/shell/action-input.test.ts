import { describe, expect, it, vi } from "vitest"
import { Plus } from "@lucide/svelte"
import { ActionInput } from "./action-input"

function setup(touch: boolean) {
  let open = false
  const onclick = vi.fn(),
    activate = vi.fn(),
    reveal = vi.fn(() => {
      open = true
    })
  const input = new ActionInput({
    action: () => ({ label: "Add title", icon: Plus, onclick }),
    open: () => open,
    touch: () => touch,
    reveal,
    activate,
  })
  return { input, onclick, activate, reveal }
}
describe("route action activation", () => {
  it("discloses routes on touch before running the action on a second activation", () => {
    const { input, reveal, onclick, activate } = setup(true)
    input.click(new MouseEvent("click"))
    expect(reveal).toHaveBeenCalledOnce()
    expect(onclick).not.toHaveBeenCalled()
    input.click(new MouseEvent("click"))
    expect(onclick).toHaveBeenCalledOnce()
    expect(activate).toHaveBeenCalledOnce()
  })
  it("runs the primary action immediately with a mouse or desktop keyboard", () => {
    const { input, reveal, onclick } = setup(false)
    input.click(new MouseEvent("click"))
    expect(onclick).toHaveBeenCalledOnce()
    expect(reveal).not.toHaveBeenCalled()
  })
  it("prevents compatibility mouse focus when handling a touch directly", () => {
    const { input } = setup(true)
    const preventDefault = vi.fn()
    input.down({
      pointerType: "touch",
      isPrimary: true,
      pointerId: 1,
      clientX: 0,
      clientY: 0,
      preventDefault,
      currentTarget: { setPointerCapture: vi.fn() },
    } as unknown as PointerEvent)
    expect(preventDefault).toHaveBeenCalledOnce()
    input.cancel()
  })
})
