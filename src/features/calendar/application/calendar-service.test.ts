import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { draft, setup } from "../testing/fixtures"

const d = (value: string) => value as DateOnly

describe("CalendarService", () => {
  it("validates, creates and invites the chosen members", async () => {
    const { service, repo } = setup()
    const created = await service.create("s1", draft(), ["ana", "ben"])
    expect(created.ok).toBe(true)
    const event = await service.get(created.ok ? created.value : "")
    expect(event.ok && event.value.attendees.map((a) => [a.userId, a.rsvp])).toEqual([
      ["ana", "going"],
      ["ben", "pending"],
    ])
    expect(event.ok && event.value.defaultReminders).toEqual([60])
    expect(await service.create("s1", draft({ title: "" }), [])).toMatchObject({
      ok: false,
      error: { field: "title" },
    })
    expect(repo.events.size).toBe(1)
  })

  it("updates, re-invites only when asked and removes", async () => {
    const { service } = setup()
    const id = (await service.create("s1", draft(), ["ana", "ben"])) as { value: string }
    expect(await service.update(id.value, draft({ title: "Renamed" }))).toEqual({
      ok: true,
      value: undefined,
    })
    let event = await service.get(id.value)
    expect(event.ok && [event.value.title, event.value.attendees.length]).toEqual(["Renamed", 2])
    await service.update(id.value, draft(), ["ana"])
    event = await service.get(id.value)
    expect(event.ok && event.value.attendees.length).toBe(1)
    expect((await service.update(id.value, draft({ endTime: "x" }))).ok).toBe(false)
    expect((await service.remove(id.value)).ok).toBe(true)
    expect((await service.get(id.value)).ok).toBe(false)
  })

  it("answers for me and sets my reminders within the offered choices", async () => {
    const { service } = setup("ben")
    const id = (await service.create("s1", draft(), [])) as { value: string }
    expect((await service.rsvp(id.value, "maybe")).ok).toBe(true)
    expect((await service.setMyReminders(id.value, [10, 1440])).ok).toBe(true)
    const event = await service.get(id.value)
    expect(event.ok && event.value.attendees).toEqual([{ userId: "ben", rsvp: "maybe" }])
    expect(event.ok && event.value.myReminders).toEqual([10, 1440])
    expect(await service.setMyReminders(id.value, [7])).toMatchObject({ ok: false })
  })

  it("reads long ranges in windows of at most 92 days", async () => {
    const { service, repo } = setup()
    await service.create("s1", draft({ startDate: "2026-12-30", endDate: "2026-12-30" }), [])
    const result = await service.range("s1", d("2026-10-01"), d("2027-03-31"), "UTC")
    expect(repo.windows).toEqual([
      ["2026-10-01", "2027-01-01"],
      ["2027-01-02", "2027-03-31"],
    ])
    expect(result.ok && result.value.entries.map((e) => e.title)).toEqual(["Movie night"])
  })

  it("lists this week's events and occasions only", async () => {
    const { service, repo } = setup()
    await service.create("s1", draft(), [])
    repo.extra.push({
      kind: "task",
      id: "t1",
      title: "Due",
      ideaId: "i1",
      status: "todo",
      myRsvp: null,
      timing: { allDay: true, startDate: d("2026-10-17"), endDate: d("2026-10-17") },
    })
    const week = await service.week("s1", d("2026-10-14"), "UTC")
    expect(week.ok && week.value.map((e) => e.title)).toEqual(["Movie night"])
    expect(repo.windows.at(-1)).toEqual(["2026-10-14", "2026-10-20"])
  })

  it("passes link searches and the members through", async () => {
    const { service } = setup()
    expect(await service.linkSearch("s1", "watch_item", "du")).toEqual({
      ok: true,
      value: [{ kind: "watch_item", id: "w1", label: "Dune" }],
    })
    expect((await service.watchNight("s1")).ok).toBe(true)
    expect((await service.members("s1")).ok).toBe(true)
  })
})
