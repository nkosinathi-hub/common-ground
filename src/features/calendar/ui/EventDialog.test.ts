import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { setup } from "../testing/fixtures"
import CalendarPage from "./CalendarPage.svelte"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideCalendar } from "./context"

async function open(button: string) {
  const { service, repo } = setup()
  render(Provided, {
    props: {
      provide: () => provideCalendar({ service }),
      component: CalendarPage,
      props: { spaceId: "s1" },
    },
  })
  await fireEvent.click(await screen.findByRole("button", { name: button }))
  return { repo, dialog: within(await screen.findByRole("dialog")) }
}

beforeEach(() => {
  localStorage.clear()
  location.hash = ""
})
afterEach(cleanup)

describe("EventDialog", () => {
  it("adds an all-day event inviting everyone, then opens it", async () => {
    const { repo, dialog } = await open("New event")
    await fireEvent.input(dialog.getByLabelText("Title"), { target: { value: "Picnic" } })
    await fireEvent.click(dialog.getByRole("tab", { name: "People" }))
    expect(await dialog.findByRole("button", { name: "Ben" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    await fireEvent.click(dialog.getByRole("tab", { name: "When" }))
    await fireEvent.click(dialog.getByRole("switch", { name: "All day" }))
    expect(dialog.queryByLabelText("Start time")).toBeNull()
    await fireEvent.click(dialog.getByRole("button", { name: "Create event" }))
    await waitFor(() => expect(location.hash).toMatch(/calendar\/e1$/))
    const [event] = [...repo.events.values()]
    expect(event).toMatchObject({ title: "Picnic", timing: { allDay: true } })
    expect(event!.attendees.map((a) => a.userId)).toEqual(["ana", "ben"])
    expect(location.hash).toBe(`#/s/s1/calendar/${event!.id}`)
  })

  it("shows what is wrong on the tab that holds it and keeps the dialog open", async () => {
    const { repo, dialog } = await open("New event")
    await fireEvent.input(dialog.getByLabelText("Title"), { target: { value: "Late" } })
    await fireEvent.click(dialog.getByRole("tab", { name: "When" }))
    await fireEvent.input(dialog.getByLabelText("End time"), { target: { value: "00:01" } })
    await fireEvent.click(dialog.getByRole("tab", { name: "Details" }))
    await fireEvent.click(dialog.getByRole("button", { name: "Create event" }))
    await waitFor(() =>
      expect(dialog.getByRole("tab", { name: "When" })).toHaveAttribute("aria-selected", "true"),
    )
    expect(repo.events.size).toBe(0)
  })

  it("plans a watch night from the watch-together list", async () => {
    const { dialog } = await open("New event")
    await fireEvent.click(dialog.getByRole("tab", { name: "People" }))
    await fireEvent.click(await dialog.findByRole("checkbox", { name: "Plan a watch night" }))
    const picker = await dialog.findByLabelText("Watch together")
    await dialog.findByRole("option", { name: "Dune" })
    await fireEvent.change(picker, { target: { value: "w1" } })
    expect(dialog.getByText("Dune", { selector: "strong" })).toBeVisible()
    await fireEvent.click(dialog.getByRole("tab", { name: "When" }))
    expect(dialog.getByLabelText("Start time")).toHaveValue("20:00")
    await fireEvent.click(dialog.getByRole("tab", { name: "Details" }))
    expect(dialog.getByLabelText("Title")).toHaveValue("Watch night: Dune")
  })

  it("links an idea found by search, and unlinks it", async () => {
    const { dialog } = await open("New event")
    await fireEvent.click(dialog.getByRole("tab", { name: "People" }))
    await fireEvent.click(dialog.getByRole("radio", { name: "Idea" }))
    await fireEvent.click(await dialog.findByRole("button", { name: "Tea bar" }))
    expect(dialog.getByText("Tea bar", { selector: "strong" })).toBeVisible()
    await fireEvent.click(dialog.getByRole("button", { name: "Remove link" }))
    expect(dialog.getByRole("searchbox", { name: "Search to link" })).toBeVisible()
  })
})
