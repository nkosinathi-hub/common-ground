import { cleanup, fireEvent, render, screen, within } from "@testing-library/svelte"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { draft, setup } from "../testing/fixtures"
import CalendarPage from "./CalendarPage.svelte"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideCalendar } from "./context"

async function renderPage() {
  const { service } = setup()
  await service.create("s1", draft({ title: "Dinner", allDay: true }), [])
  render(Provided, {
    props: {
      provide: () => provideCalendar({ service }),
      component: CalendarPage,
      props: { spaceId: "s1" },
    },
  })
  return within(await screen.findByRole("grid"))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date(2026, 9, 16, 12))
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("CalendarPage", () => {
  it("shows the month as a grid with labelled days, today selected", async () => {
    const grid = await renderPage()
    expect(screen.getByRole("heading", { name: "October 2026" })).toHaveAttribute(
      "aria-live",
      "polite",
    )
    const today = grid.getByRole("gridcell", { name: "Fri 16 October, 1 event" })
    expect(today).toHaveAttribute("tabindex", "0")
    expect(today).toHaveAttribute("aria-current", "date")
    expect(grid.getAllByRole("columnheader")[0]).toHaveTextContent("Mon")
    expect(
      within(screen.getByTestId("day-panel")).getByRole("link", { name: /Dinner/ }),
    ).toBeVisible()
  })

  it("moves one tab stop with the arrow keys, Home/End and PageDown", async () => {
    const grid = await renderPage()
    const today = grid.getByRole("gridcell", { name: /Fri 16 October/ })
    today.focus()
    await fireEvent.keyDown(today, { key: "ArrowRight" })
    const saturday = grid.getByRole("gridcell", { name: "Sat 17 October" })
    expect(saturday).toHaveFocus()
    expect(saturday).toHaveAttribute("tabindex", "0")
    expect(today).toHaveAttribute("tabindex", "-1")
    await fireEvent.keyDown(saturday, { key: "Home" })
    expect(grid.getByRole("gridcell", { name: "Mon 12 October" })).toHaveFocus()
    await fireEvent.keyDown(document.activeElement!, { key: "PageDown" })
    expect(await screen.findByRole("heading", { name: "November 2026" })).toBeVisible()
    expect(screen.getByRole("gridcell", { name: "Thu 12 November" })).toHaveFocus()
  })

  it("pages months with the toolbar and returns to today", async () => {
    await renderPage()
    await fireEvent.click(screen.getByRole("button", { name: "Next month" }))
    expect(await screen.findByRole("heading", { name: "November 2026" })).toBeVisible()
    await fireEvent.click(screen.getByRole("button", { name: "Previous month" }))
    await fireEvent.click(screen.getByRole("button", { name: "Previous month" }))
    expect(await screen.findByRole("heading", { name: "September 2026" })).toBeVisible()
    await fireEvent.click(screen.getByRole("button", { name: "Today" }))
    expect(await screen.findByRole("heading", { name: "October 2026" })).toBeVisible()
    expect(localStorage.getItem("common-ground:calendar.month.s1")).toBe("2026-10")
  })

  it("lists the agenda by day and remembers the choice", async () => {
    await renderPage()
    await fireEvent.click(screen.getByRole("tab", { name: "Agenda" }))
    expect(await screen.findByRole("heading", { name: "Friday 16 October" })).toBeVisible()
    expect(
      within(screen.getByTestId("agenda")).getByRole("link", { name: "Event: Dinner" }),
    ).toBeVisible()
    expect(localStorage.getItem("common-ground:calendar.view")).toBe("agenda")
  })
})
