import type { DateOnly } from "./date-only"

/** The one locale for dates, times and money on screen. */
export const LOCALE = "en-ZA"

const dateTime = (zone?: string) =>
  new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone: zone })
const day = (zone?: string) =>
  new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: zone,
  })

/** An instant (ISO timestamp) as day and time in the viewer's time zone: "15 Oct 2026, 10:00". */
export const formatDateTime = (iso: string): string => dateTime().format(new Date(iso))

/** An instant as the day it falls on in the viewer's time zone: "15 Oct 2026". */
export const formatDay = (iso: string): string => day().format(new Date(iso))

/** A date-only value as that calendar day; it never shifts with the viewer's time zone. */
export const formatDateOnly = (date: DateOnly): string =>
  day("UTC").format(new Date(`${date}T00:00:00Z`))
