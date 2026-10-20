import type { DeviceStore } from "@/shared/domain"
import { deviceStore } from "@/shared/ui"
import type { YearMonth } from "../domain"

export type CalendarView = "month" | "agenda"

/** Per-device conveniences: the last view, and the last month looked at in each space. */
export interface ViewMemory {
  view(): CalendarView | null
  month(spaceId: string): YearMonth | null
  saveView(view: CalendarView): void
  saveMonth(spaceId: string, month: YearMonth): void
}

const VIEW_KEY = "calendar.view"
const monthKey = (spaceId: string) => `calendar.month.${spaceId}`
const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/

/** Without storage the calendar simply opens on its defaults. */
export function browserMemory(store: DeviceStore = deviceStore()): ViewMemory {
  return {
    view() {
      const view = store.read(VIEW_KEY)
      return view === "month" || view === "agenda" ? view : null
    },
    month(spaceId) {
      const match = MONTH.exec(store.read(monthKey(spaceId)) ?? "")
      return match ? { year: Number(match[1]), month: Number(match[2]) } : null
    },
    saveView: (view) => store.write(VIEW_KEY, view),
    saveMonth: (spaceId, { year, month }) =>
      store.write(monthKey(spaceId), `${year}-${String(month).padStart(2, "0")}`),
  }
}
