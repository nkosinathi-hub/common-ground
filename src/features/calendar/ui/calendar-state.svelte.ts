import type { DateOnly } from "@/shared/domain"
import { Resource } from "@/shared/ui"
import type { CalendarService } from "../application/calendar-service"
import type { CalendarWindow } from "../application/ports"
import {
  addMonths,
  dateOf,
  entriesByDay,
  monthGrid,
  monthOf,
  monthTitle,
  type DayItem,
  type WeekStart,
  type YearMonth,
} from "../domain"
import { AgendaState } from "./agenda-state.svelte"
import type { CalendarView, ViewMemory } from "./view-memory"

export interface CalendarOptions {
  readonly service: CalendarService
  readonly spaceId: string
  readonly zone: string
  readonly today: DateOnly
  readonly weekStart: WeekStart
  readonly memory: ViewMemory
  /** md and up: the month view by default; phones start on the agenda. */
  readonly wide: boolean
}

const sameMonth = (a: YearMonth, b: YearMonth) => a.year === b.year && a.month === b.month
/** The calendar page: which month and view, the selected day, and the loaded window. */
export class CalendarState {
  view = $state<CalendarView>("agenda")
  month = $state<YearMonth>({ year: 1970, month: 1 })
  selected = $state<DateOnly>("1970-01-01" as DateOnly)
  readonly window: Resource<CalendarWindow>
  readonly agenda: AgendaState

  constructor(private readonly options: CalendarOptions) {
    const { service, spaceId, zone, memory } = options
    this.view = memory.view() ?? (options.wide ? "month" : "agenda")
    this.show(memory.month(spaceId) ?? monthOf(options.today))
    this.window = new Resource(() => service.range(spaceId, ...this.gridRange, zone))
    this.agenda = new AgendaState((from, to) => service.range(spaceId, from, to, zone), zone)
  }

  get grid(): DateOnly[] {
    return monthGrid(this.month.year, this.month.month, this.options.weekStart)
  }

  get gridRange(): [DateOnly, DateOnly] {
    return [this.grid[0]!, this.grid[41]!]
  }

  get title(): string {
    return monthTitle(this.month)
  }

  get days(): Map<DateOnly, DayItem[]> {
    const entries = this.window.value?.entries ?? []
    return entriesByDay(entries, ...this.gridRange, this.options.zone)
  }

  /** Loads the view; the agenda starts today, and on phones (M05) also needs its month. */
  async load(): Promise<void> {
    if (this.view === "month") return this.window.load()
    const first = dateOf(this.month.year, this.month.month, 1)
    const inThisMonth = sameMonth(this.month, monthOf(this.options.today))
    const agenda = this.agenda.start(inThisMonth ? this.options.today : first)
    await Promise.all([agenda, this.options.wide ? null : this.window.load()])
  }

  private show(month: YearMonth, selected?: DateOnly): void {
    this.month = month
    const today = this.options.today
    const isNow = sameMonth(month, monthOf(today))
    this.selected = selected ?? (isNow ? today : dateOf(month.year, month.month, 1))
  }

  private go(month: YearMonth, selected?: DateOnly): Promise<void> {
    this.show(month, selected)
    this.options.memory.saveMonth(this.options.spaceId, month)
    return this.load()
  }

  move = (months: number) => this.go(addMonths(this.month, months))
  goToday = () => this.go(monthOf(this.options.today), this.options.today)

  /** Selects a day; one outside the shown month brings that month into view. */
  async select(day: DateOnly): Promise<void> {
    if (sameMonth(monthOf(day), this.month)) this.selected = day
    else await this.go(monthOf(day), day)
  }

  setView(view: CalendarView): Promise<void> {
    this.view = view
    this.options.memory.saveView(view)
    return this.load()
  }
}
