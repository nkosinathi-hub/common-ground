import { untrack } from "svelte"
import type { AppError, DateOnly, Result } from "@/shared/domain"
import type { CalendarWindow } from "../application/ports"
import { addDays, entriesByDay, entryKey, type CalendarEntry, type DayItem } from "../domain"

export type WindowLoader = (from: DateOnly, to: DateOnly) => Promise<Result<CalendarWindow>>

/** The agenda: days with entries from a start day, one window at a time (ADR 0008). */
export class AgendaState {
  entries = $state<CalendarEntry[]>([])
  loading = $state(true)
  loadingMore = $state(false)
  error = $state<AppError | null>(null)
  truncated = $state(false)
  private from = $state<DateOnly | null>(null)
  private until = $state<DateOnly | null>(null)
  private windows = $state(0)
  private generation = 0

  constructor(
    private readonly loader: WindowLoader,
    private readonly zone: string,
    private readonly windowDays = 31,
    private readonly maxWindows = 12,
  ) {}

  get hasMore(): boolean {
    return this.windows > 0 && this.windows < this.maxWindows
  }

  /** Days in order, each with its sorted items. */
  get days(): [DateOnly, DayItem[]][] {
    if (!this.from || !this.until) return []
    return [...entriesByDay(this.entries, this.from, this.until, this.zone)]
  }

  async start(from: DateOnly): Promise<void> {
    const mine = untrack(() => {
      this.loading = true
      return ++this.generation
    })
    const to = addDays(from, this.windowDays - 1)
    const result = await this.loader(from, to)
    if (mine !== this.generation) return
    this.loading = false
    this.error = result.ok ? null : result.error
    if (!result.ok) return
    this.from = from
    this.until = to
    this.windows = 1
    this.entries = [...result.value.entries]
    this.truncated = result.value.truncated
  }

  async loadMore(): Promise<void> {
    const until = untrack(() => this.until)
    if (!until || !this.hasMore || untrack(() => this.loadingMore)) return
    const mine = this.generation
    this.loadingMore = true
    const to = addDays(until, this.windowDays)
    const result = await this.loader(addDays(until, 1), to)
    if (mine !== this.generation) return
    this.loadingMore = false
    this.error = result.ok ? null : result.error
    if (!result.ok) return
    const seen = this.entries.map(entryKey)
    this.entries = [
      ...this.entries,
      ...result.value.entries.filter((e) => !seen.includes(entryKey(e))),
    ]
    this.until = to
    this.windows += 1
    this.truncated ||= result.value.truncated
  }
}
