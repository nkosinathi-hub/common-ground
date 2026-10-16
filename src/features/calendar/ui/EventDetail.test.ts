import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it, vi } from "vitest"
import { draft, setup } from "../testing/fixtures"
import { calendarContext } from "./context"
import EventDetail from "./EventDetail.svelte"

async function show(me: string, isOwner = false) {
  const { service, repo } = setup("ana")
  const made = await service.create("s1", draft({ title: "Dinner; late", location: "Ana's" }), [
    "ben",
  ])
  const eventId = made.ok ? made.value : ""
  await service.create("s1", draft({ title: "Quiz", startTime: "20:00", endTime: "22:00" }), [])
  repo.me = me
  render(EventDetail, {
    props: { spaceId: "s1", eventId, me, isOwner },
    context: calendarContext({ service }),
  })
  await screen.findByRole("heading", { level: 1, name: "Dinner; late" })
  return { repo, eventId }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("EventDetail", () => {
  it("lets an invited member answer and shows who is coming", async () => {
    const { repo, eventId } = await show("ben")
    const names = screen.getByTestId("rsvp-names")
    expect(names).toHaveTextContent("Going: Ana")
    expect(names).toHaveTextContent("Not answered: Ben")
    await fireEvent.click(screen.getByRole("radio", { name: "Maybe (0)" }))
    await waitFor(() => expect(screen.getByTestId("rsvp-names")).toHaveTextContent("Maybe: Ben"))
    expect(repo.events.get(eventId)!.attendees).toContainEqual({ userId: "ben", rsvp: "maybe" })
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Delete event" })).toBeNull()
  })

  it("warns the author about another event they are going to at the same time", async () => {
    await show("ana")
    const warning = await screen.findByTestId("event-conflict")
    expect(within(warning).getByText("Quiz")).toBeVisible()
    expect(screen.getByRole("button", { name: "Edit" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Delete event" })).toBeVisible()
  })

  it("downloads the event as an .ics file", async () => {
    await show("ben", true)
    let saved: Blob | null = null
    vi.spyOn(URL, "createObjectURL").mockImplementation(
      (blob) => ((saved = blob as Blob), "blob:x"),
    )
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    await fireEvent.click(screen.getByRole("button", { name: "Download .ics" }))
    expect(await saved!.text()).toContain("SUMMARY:Dinner\\; late")
    expect(saved!.type).toBe("text/calendar")
    expect(screen.getByRole("button", { name: "Delete event" })).toBeVisible()
  })

  it("saves my own reminder", async () => {
    const { repo, eventId } = await show("ben")
    await fireEvent.change(screen.getByLabelText("Remind me"), { target: { value: "1440" } })
    await waitFor(() => expect(repo.events.get(eventId)!.myReminders).toEqual([1440]))
  })

  it("refuses an event from another space", async () => {
    const { service } = setup()
    const made = await service.create("other", draft(), [])
    const eventId = made.ok ? made.value : ""
    render(EventDetail, {
      props: { spaceId: "s1", eventId, me: "ana", isOwner: false },
      context: calendarContext({ service }),
    })
    expect(await screen.findByText("That event is not in this space")).toBeVisible()
  })
})
