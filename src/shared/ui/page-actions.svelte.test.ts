import { Plus } from "@lucide/svelte"
import { describe, expect, it, vi } from "vitest"
import { PageActions } from "./page-actions.svelte"

describe("page actions", () => {
  it("clears a page's action when it unmounts", () => {
    const actions = new PageActions()
    const action = { label: "Write a note", icon: Plus, onclick: vi.fn() }
    const leave = actions.register(action)
    expect(actions.current).toBe(action)
    actions.current?.onclick()
    expect(action.onclick).toHaveBeenCalledOnce()
    leave()
    expect(actions.current).toBeNull()
  })

  it("does not clear the new page's action when an old page finishes cleaning up", () => {
    const actions = new PageActions()
    const old = actions.register({ label: "Add title", icon: Plus, onclick: vi.fn() })
    actions.register({ label: "New event", icon: Plus, onclick: vi.fn() })
    old()
    expect(actions.current?.label).toBe("New event")
  })
})
