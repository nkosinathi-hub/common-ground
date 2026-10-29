import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { Columns3, List } from "@lucide/svelte"
import { afterEach, describe, expect, it } from "vitest"
import ViewToggle from "./ViewToggle.svelte"

afterEach(cleanup)

const options = [
  { value: "list", label: "List", icon: List },
  { value: "board", label: "Board", icon: Columns3 },
] as const

describe("ViewToggle", () => {
  it("marks the current view pressed and reports a change", async () => {
    const chosen: string[] = []
    render(ViewToggle, {
      props: { value: "list", options, onchange: (v: string) => chosen.push(v) },
    })
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Board" })).not.toBeChecked()
    await fireEvent.click(screen.getByRole("radio", { name: "Board" }))
    expect(chosen).toEqual(["board"])
  })
})
