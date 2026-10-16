import type { YearMonth } from "../domain"

export type CalendarView = "month" | "agenda"

/** Per-device conveniences: the last view, and the last month looked at in each space. */
export interface ViewMemory {
  view(): CalendarView | null
  month(spaceId: string): YearMonth | null
  saveView(view: CalendarView): void
  saveMonth(spaceId: string, month: YearMonth): void
}

const VIEW_KEY = "cg.calendar.view"
const monthKey = (spaceId: string) => `cg.calendar.month.${spaceId}`
const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/

/** localStorage can be missing or throw (private windows, blocked site data): never fail on it. */
export function browserMemory(storage: Storage | (() => Storage) = () => localStorage): ViewMemory {
  const store = () => (typeof storage === "function" ? storage() : storage)
  const read = (key: string): string | null => {
    try {
      return store().getItem(key)
    } catch {
      return null
    }
  }
  const write = (key: string, value: string) => {
    try {
      store().setItem(key, value)
    } catch {
      // Remembering is a convenience; without storage the calendar opens on its defaults.
    }
  }
  return {
    view() {
      const view = read(VIEW_KEY)
      return view === "month" || view === "agenda" ? view : null
    },
    month(spaceId) {
      const match = MONTH.exec(read(monthKey(spaceId)) ?? "")
      return match ? { year: Number(match[1]), month: Number(match[2]) } : null
    },
    saveView: (view) => write(VIEW_KEY, view),
    saveMonth: (spaceId, { year, month }) =>
      write(monthKey(spaceId), `${year}-${String(month).padStart(2, "0")}`),
  }
}
