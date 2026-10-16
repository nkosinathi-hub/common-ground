import { cleanup, render, screen, within } from "@testing-library/svelte"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { draft, setup } from "../testing/fixtures"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { provideCalendar } from "./context"
import UpcomingEvents from "./UpcomingEvents.svelte"

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date(2026, 9, 16, 12))
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("UpcomingEvents", () => {
  it("lists this week's events by day, today first", async () => {
    const { service } = setup()
    await service.create("s1", draft({ title: "Picnic", allDay: true }), [])
    await service.create(
      "s1",
      draft({ title: "Gig", allDay: true, startDate: "2026-10-18", endDate: "2026-10-18" }),
      [],
    )
    await service.create(
      "s1",
      draft({ title: "Later", allDay: true, startDate: "2026-10-30", endDate: "2026-10-30" }),
      [],
    )
    render(Provided, {
      props: {
        provide: () => provideCalendar({ service }),
        component: UpcomingEvents,
        props: { spaceId: "s1" },
      },
    })
    const list = within(await screen.findByTestId("upcoming-events"))
    expect(list.getByText("Today")).toBeVisible()
    expect(list.getByText("Sunday 18 October")).toBeVisible()
    expect(
      list.getAllByRole("link").map((link) => link.textContent?.replace(/\s+/g, " ").trim()),
    ).toEqual(["Event: Picnic", "Event: Gig"])
  })

  it("points to the calendar when the week is empty", async () => {
    const { service } = setup()
    render(Provided, {
      props: {
        provide: () => provideCalendar({ service }),
        component: UpcomingEvents,
        props: { spaceId: "s1" },
      },
    })
    expect(await screen.findByText("Nothing this week")).toBeVisible()
    expect(screen.getByRole("link", { name: "Open the calendar" })).toHaveAttribute(
      "href",
      "#/s/s1/calendar",
    )
  })
})
