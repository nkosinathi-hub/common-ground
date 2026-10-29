import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { Plus } from "@lucide/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import AvatarStack from "./AvatarStack.svelte"
import Chip from "./Chip.svelte"
import Fab from "./Fab.svelte"
import InitialAvatar from "./InitialAvatar.svelte"
import Logo from "./Logo.svelte"
import { html } from "./testing/snippet"

afterEach(cleanup)

describe("identity components", () => {
  it("draws the logo as a named image, or hides it beside a wordmark", () => {
    render(Logo, { label: "Common Ground", size: 40 })
    expect(screen.getByRole("img", { name: "Common Ground" })).toHaveAttribute("width", "40")
    cleanup()
    const { container } = render(Logo)
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("shows a person's initial in the tone asked for", () => {
    const { container } = render(InitialAvatar, { name: "ana", tone: "brand" })
    expect(screen.getByLabelText("ana")).toHaveTextContent("A")
    expect(container.querySelector('[data-tone="brand"]')).not.toBeNull()
  })

  it("stacks up to three people as one image and counts the rest", () => {
    const people = ["Ana", "Ben", "Cy", "Dee"].map((name) => ({ name }))
    render(AvatarStack, { people, label: "On this idea: Ana, Ben, Cy, Dee" })
    const stack = screen.getByRole("img", { name: /On this idea/ })
    expect(stack).toHaveTextContent("A B C +1")
  })

  it("names an icon FAB by its label and shows the label when extended", () => {
    render(Fab, { icon: Plus, label: "Add a title", href: "#/x" })
    expect(screen.getByRole("link", { name: "Add a title" })).toHaveAttribute("href", "#/x")
    cleanup()
    render(Fab, { icon: Plus, label: "Write a note", extended: true, onclick: () => {} })
    expect(screen.getByRole("button", { name: "Write a note" })).toHaveTextContent("Write a note")
  })

  it("toggles a selectable chip and removes a removable one", async () => {
    const onclick = vi.fn()
    render(Chip, { children: html("<span>Hopeful</span>"), selected: true, onclick })
    const chip = screen.getByRole("button", { name: "Hopeful" })
    expect(chip).toHaveAttribute("aria-pressed", "true")
    await fireEvent.click(chip)
    expect(onclick).toHaveBeenCalled()
    cleanup()
    const onremove = vi.fn()
    render(Chip, { children: html("<span>travel</span>"), label: "travel", onremove })
    await fireEvent.click(screen.getByRole("button", { name: "Remove travel" }))
    expect(onremove).toHaveBeenCalled()
  })
})
