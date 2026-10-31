import { describe, expect, it } from "vitest"
import { appError, err, type DateOnly } from "@/shared/domain"
import { draft, setup } from "../testing/fixtures"
import { AgendaState } from "./agenda-state.svelte"

const d = (value: string) => value as DateOnly

async function agendaWith(...days: string[]) {
  const { service, repo } = setup()
  for (const day of days)
    await service.create("s1", draft({ title: day, startDate: day, endDate: day }), [])
  const loader = (from: DateOnly, to: DateOnly) => service.range("s1", from, to, "UTC")
  return { repo, agenda: new AgendaState(loader, "UTC", 3) }
}

describe("AgendaState", () => {
  it("lists the rest of the month's days with entries, then loads the next month", async () => {
    const { agenda, repo } = await agendaWith("2026-10-20", "2026-11-25")
    await agenda.start(d("2026-10-16"))
    expect(agenda.loading).toBe(false)
    expect(agenda.days.map(([day]) => day)).toEqual(["2026-10-20"])
    await agenda.loadMore()
    expect(agenda.days.map(([day]) => day)).toEqual(["2026-10-20", "2026-11-25"])
    expect(repo.windows).toEqual([
      ["2026-10-16", "2026-10-31"],
      ["2026-11-01", "2026-11-30"],
    ])
    expect(agenda.month).toEqual({ year: 2026, month: 11 })
  })

  it("does not repeat an event that spans two windows", async () => {
    const { service } = setup()
    await service.create(
      "s1",
      draft({ allDay: true, startDate: "2026-10-30", endDate: "2026-11-02" }),
      [],
    )
    const agenda = new AgendaState((f, t) => service.range("s1", f, t, "UTC"), "UTC", 3)
    await agenda.start(d("2026-10-29"))
    await agenda.loadMore()
    expect(agenda.days.map(([day, items]) => [day, items.length])).toEqual([
      ["2026-10-30", 1],
      ["2026-10-31", 1],
      ["2026-11-01", 1],
      ["2026-11-02", 1],
    ])
  })

  it("stops after the last window and keeps a load error to retry", async () => {
    const { agenda, repo } = await agendaWith()
    await agenda.start(d("2026-10-16"))
    await agenda.loadMore()
    await agenda.loadMore()
    expect(agenda.hasMore).toBe(false)
    await agenda.loadMore()
    expect(repo.windows).toHaveLength(3)
    const repoRange = repo.range.bind(repo)
    repo.range = async () => err(appError("network", "down"))
    await agenda.start(d("2026-10-16"))
    expect(agenda.error?.kind).toBe("network")
    expect(agenda.loading).toBe(false)
    repo.range = repoRange
    await agenda.start(d("2026-10-16"))
    repo.range = async () => err(appError("network", "down"))
    await agenda.loadMore()
    expect([agenda.error?.kind, agenda.loadingMore]).toEqual(["network", false])
  })
})
