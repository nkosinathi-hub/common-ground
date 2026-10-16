import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { setup } from "../testing/fixtures"
import CalendarPage from "./CalendarPage.svelte"
import { calendarContext } from "./context"

async function open(button: string) {
  const { service, repo } = setup()
  render(CalendarPage, { props: { spaceId: "s1" }, context: calendarContext({ service }) })
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
    await dialog.findByRole("checkbox", { name: "Ben" })
    expect(dialog.getByRole("checkbox", { name: "Ana" })).toBeChecked()
    await fireEvent.input(dialog.getByLabelText("Title"), { target: { value: "Picnic" } })
    await fireEvent.click(dialog.getByRole("switch", { name: "All day" }))
    expect(dialog.queryByLabelText("Start time")).toBeNull()
    await fireEvent.click(dialog.getByRole("button", { name: "Add event" }))
    await waitFor(() => expect(location.hash).toMatch(/calendar\/e1$/))
    const [event] = [...repo.events.values()]
    expect(event).toMatchObject({ title: "Picnic", timing: { allDay: true } })
    expect(event!.attendees.map((a) => a.userId)).toEqual(["ana", "ben"])
    expect(location.hash).toBe(`#/s/s1/calendar/${event!.id}`)
  })

  it("shows what is wrong and keeps the dialog open", async () => {
    const { repo, dialog } = await open("New event")
    await fireEvent.click(dialog.getByRole("button", { name: "Add event" }))
    expect(await dialog.findByText("Give the event a title of up to 200 characters")).toBeVisible()
    expect(repo.events.size).toBe(0)
  })

  it("plans a watch night from the watch-together list", async () => {
    const { dialog } = await open("Plan a watch night")
    expect(dialog.getByRole("heading", { name: "Plan a watch night" })).toBeVisible()
    const picker = await dialog.findByLabelText("Watch together")
    await dialog.findByRole("option", { name: "Dune" })
    await fireEvent.change(picker, { target: { value: "w1" } })
    expect(dialog.getByLabelText("Title")).toHaveValue("Watch night: Dune")
    expect(dialog.getByLabelText("Start time")).toHaveValue("20:00")
    expect(dialog.getByText("Dune", { selector: "strong" })).toBeVisible()
  })

  it("links an idea found by search, and unlinks it", async () => {
    const { dialog } = await open("New event")
    await fireEvent.click(dialog.getByRole("tab", { name: "Idea" }))
    await fireEvent.click(await dialog.findByRole("button", { name: "Tea bar" }))
    expect(dialog.getByText("Tea bar", { selector: "strong" })).toBeVisible()
    await fireEvent.click(dialog.getByRole("button", { name: "Remove link" }))
    expect(dialog.getByRole("searchbox", { name: "Search to link" })).toBeVisible()
  })
})
