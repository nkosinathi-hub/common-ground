import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import Column from "./testing/Column.svelte"

afterEach(cleanup)

describe("Kanban column", () => {
  it("heads the column with its count and an add button, and lists its cards", async () => {
    const onadd = vi.fn()
    render(Column, { items: [{ id: "1", title: "Campsites" }], onmove: vi.fn(), onadd })
    const column = screen.getByRole("region", { name: "Exploring" })
    expect(column).toHaveTextContent(/^Exploring 1/)
    expect(screen.getByRole("link", { name: "Campsites" })).toHaveAttribute("href", "#/i/1")
    await fireEvent.click(screen.getByRole("button", { name: "Add to Exploring" }))
    expect(onadd).toHaveBeenCalled()
  })

  it("says where new cards land when it is empty", () => {
    render(Column, { items: [], onmove: vi.fn() })
    expect(screen.getByText("New ideas land here.")).toBeInTheDocument()
  })

  it("moves a card from its menu, offering only the other columns", async () => {
    const onmove = vi.fn()
    render(Column, { items: [{ id: "1", title: "Campsites" }], onmove })
    const trigger = screen.getByRole("button", { name: "Actions for Campsites" })
    await fireEvent.keyDown(trigger, { key: "Enter" })
    expect(screen.queryByRole("menuitem", { name: "Exploring" })).toBeNull()
    await fireEvent.click(await screen.findByRole("menuitem", { name: "Planning" }))
    expect(onmove).toHaveBeenCalledWith("1", "planning")
  })
})
