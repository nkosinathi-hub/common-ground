import { getContext, setContext } from "svelte"
import type { CalendarService } from "../application/calendar-service"

const KEY = Symbol("calendar")

export interface CalendarContext {
  readonly service: CalendarService
}

/** Called once by the composition root (src/app/composition). */
export function provideCalendar(value: CalendarContext): void {
  setContext(KEY, value)
}

export function useCalendar(): CalendarContext {
  const value = getContext<CalendarContext | undefined>(KEY)
  if (!value) throw new Error("Calendar is not provided: call provideCalendar")
  return value
}

/** The context map for render({ context }) in component tests. */
export const calendarContext = (value: CalendarContext) => new Map([[KEY, value]])
