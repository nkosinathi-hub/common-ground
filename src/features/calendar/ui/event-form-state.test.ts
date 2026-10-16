import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import type { CalendarEvent } from "../domain"
import { EventFormState } from "./event-form-state.svelte"

const d = (value: string) => value as DateOnly
const event: CalendarEvent = {
  id: "e1",
  spaceId: "s1",
  title: "Dinner",
  description: "Bring wine",
  location: "Ana's",
  timeZone: "Pacific/Auckland",
  timing: { allDay: false, startsAt: "2026-10-16T06:00:00Z", endsAt: "2026-10-16T08:30:00Z" },
  repeatsYearly: false,
  link: { kind: "idea", id: "i1", label: "Tea bar", ideaId: "i1" },
  defaultReminders: [1440],
  createdBy: "ana",
  attendees: ["ana", "ben"].map((userId) => ({ userId, rsvp: "going" as const })),
  myReminders: [],
}

describe("EventFormState", () => {
  it("starts a new event on a day, in the viewer's zone, inviting everyone", () => {
    const form = new EventFormState()
    form.reset(d("2026-10-20"), "Europe/London", ["ana", "ben"])
    const draft = form.toDraft()
    expect(draft).toMatchObject({
      title: "",
      startDate: "2026-10-20",
      endDate: "2026-10-20",
      startTime: "19:00",
      endTime: "20:00",
      timeZone: "Europe/London",
      reminders: [60],
      link: null,
    })
    expect(form.attendees).toEqual(["ana", "ben"])
  })

  it("fills from an event in its own zone, with its link and default reminder", () => {
    const form = new EventFormState()
    form.fill(event)
    expect(form.toDraft()).toMatchObject({
      title: "Dinner",
      startDate: "2026-10-16",
      startTime: "19:00",
      endTime: "21:30",
      timeZone: "Pacific/Auckland",
      reminders: [1440],
      link: { kind: "idea", id: "i1" },
    })
    expect(form.attendees).toEqual(["ana", "ben"])
    form.fill({
      ...event,
      timing: { allDay: true, startDate: d("2026-12-25"), endDate: d("2026-12-25") },
      repeatsYearly: true,
      defaultReminders: [],
      link: null,
    })
    expect(form.toDraft()).toMatchObject({
      allDay: true,
      startDate: "2026-12-25",
      repeatsYearly: true,
      reminders: [],
    })
  })

  it("keeps the end on or after the start, and repeats only one-day all-day events", () => {
    const form = new EventFormState()
    form.reset(d("2026-10-20"), "UTC", [])
    form.setStartDate("2026-10-25")
    expect(form.endDate).toBe("2026-10-25")
    form.allDay = true
    form.repeatsYearly = true
    expect(form.canRepeat).toBe(true)
    form.endDate = "2026-10-26"
    expect(form.canRepeat).toBe(false)
    expect(form.toDraft().repeatsYearly).toBe(false)
    form.setStartDate("2026-10-21")
    expect(form.endDate).toBe("2026-10-26")
  })

  it("plans a watch night from a title and toggles attendees", () => {
    const form = new EventFormState()
    form.reset(d("2026-10-20"), "UTC", ["ana"])
    form.planWatchNight({ kind: "watch_item", id: "w1", label: "Dune" })
    expect(form.toDraft()).toMatchObject({
      title: "Watch night: Dune",
      startTime: "20:00",
      endTime: "22:00",
      link: { kind: "watch_item", id: "w1" },
    })
    form.toggleAttendee("ben", true)
    form.toggleAttendee("ana", false)
    expect(form.attendees).toEqual(["ben"])
  })
})
