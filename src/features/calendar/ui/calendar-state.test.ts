import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { draft, setup } from "../testing/fixtures"
import { CalendarState } from "./calendar-state.svelte"
import type { ViewMemory } from "./view-memory"

const d = (value: string) => value as DateOnly

function memory(
  saved: Partial<{ view: "month" | "agenda"; month: { year: number; month: number } }> = {},
) {
  const log: unknown[] = []
  const value: ViewMemory = {
    view: () => saved.view ?? null,
    month: () => saved.month ?? null,
    saveView: (view) => void log.push(view),
    saveMonth: (_space, month) => void log.push(month),
  }
  return { log, value }
}

function calendar(options: { wide?: boolean; saved?: Parameters<typeof memory>[0] } = {}) {
  const { service, repo } = setup()
  const remembered = memory(options.saved)
  const state = new CalendarState({
    service,
    spaceId: "s1",
    zone: "UTC",
    today: d("2026-10-16"),
    weekStart: 1,
    memory: remembered.value,
    wide: options.wide ?? true,
  })
  return { state, service, repo, log: remembered.log }
}

describe("CalendarState", () => {
  it("opens on this month: the month view when wide, the agenda when narrow", () => {
    expect(calendar().state.view).toBe("month")
    const narrow = calendar({ wide: false }).state
    expect([narrow.view, narrow.month, narrow.selected]).toEqual([
      "agenda",
      { year: 2026, month: 10 },
      "2026-10-16",
    ])
  })

  it("prefers the remembered view and month", () => {
    const { state } = calendar({ saved: { view: "agenda", month: { year: 2027, month: 2 } } })
    expect([state.view, state.month, state.selected]).toEqual([
      "agenda",
      { year: 2027, month: 2 },
      "2027-02-01",
    ])
  })

  it("loads the six-week grid window and groups its entries by day", async () => {
    const { state, service, repo } = calendar()
    await service.create("s1", draft({ startDate: "2026-11-02", endDate: "2026-11-02" }), [])
    await state.load()
    expect(repo.windows).toEqual([["2026-09-28", "2026-11-08"]])
    expect(state.days.get(d("2026-11-02"))?.map((i) => i.entry.title)).toEqual(["Movie night"])
    expect(state.title).toBe("October 2026")
  })

  it("moves by month, back to today and follows a selected day into another month", async () => {
    const { state, log } = calendar()
    await state.move(1)
    expect([state.month, state.selected]).toEqual([{ year: 2026, month: 11 }, "2026-11-01"])
    await state.goToday()
    expect([state.month, state.selected]).toEqual([{ year: 2026, month: 10 }, "2026-10-16"])
    await state.select(d("2026-09-30"))
    expect([state.month, state.selected]).toEqual([{ year: 2026, month: 9 }, "2026-09-30"])
    await state.select(d("2026-09-02"))
    expect(log).toEqual([
      { year: 2026, month: 11 },
      { year: 2026, month: 10 },
      { year: 2026, month: 9 },
    ])
  })

  it("switches view, remembers it and starts the agenda at today in this month", async () => {
    const { state, repo, log } = calendar()
    await state.setView("agenda")
    expect(log).toEqual(["agenda"])
    expect(repo.windows.at(-1)).toEqual(["2026-10-16", "2026-11-15"])
    await state.move(1)
    expect(repo.windows.at(-1)).toEqual(["2026-11-01", "2026-12-01"])
    expect(state.agenda.loading).toBe(false)
  })
})
