import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { Search } from "@lucide/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import DialogShell from "./DialogShell.svelte"
import FormField from "./FormField.svelte"
import { html } from "./testing/snippet"

afterEach(cleanup)

const dialog = (props: Record<string, unknown>) =>
  render(DialogShell, {
    open: true,
    title: "Leave a little note",
    description: "A hello or a reminder.",
    children: html("<label>Your note <textarea></textarea></label>"),
    ...props,
  })

describe("DialogShell", () => {
  it("names the dialog by its title and submits with the one primary", async () => {
    const onsubmit = vi.fn()
    dialog({ primary: "Leave note", onsubmit })
    const box = screen.getByRole("dialog", { name: "Leave a little note" })
    expect(box).toHaveAccessibleDescription("A hello or a reminder.")
    await fireEvent.click(screen.getByRole("button", { name: "Leave note" }))
    expect(onsubmit).toHaveBeenCalledOnce()
  })

  it("does not submit while busy, and Cancel closes it", async () => {
    const onsubmit = vi.fn()
    dialog({ primary: "Leave note", onsubmit, busy: true })
    expect(screen.getByRole("button", { name: "Leave note" })).toBeDisabled()
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(onsubmit).not.toHaveBeenCalled()
  })

  it("opens on its first field rather than the close button", async () => {
    dialog({ primary: "Leave note" })
    await waitFor(() => expect(screen.getByLabelText("Your note")).toHaveFocus())
  })

  it("has a close button and a destructive primary when asked", () => {
    dialog({ primary: "Delete space", destructive: true })
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete space" }).className).toContain(
      "bg-destructive",
    )
  })
})

describe("FormField", () => {
  it("labels the input, describes it by its hint, and sets the width", () => {
    const { container } = render(FormField, {
      id: "q",
      label: "Search",
      hint: "Titles and people",
      icon: Search,
      width: "search",
    })
    const input = screen.getByLabelText("Search")
    expect(input).toHaveAccessibleDescription("Titles and people")
    expect(container.firstElementChild!.className).toContain("w-field-search")
  })

  it("shows the error instead of the hint and marks the input invalid", () => {
    render(FormField, {
      id: "e",
      label: "Email",
      hint: "We never share it",
      error: "Enter an email",
    })
    const input = screen.getByLabelText("Email")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAccessibleDescription("Enter an email")
  })
})
