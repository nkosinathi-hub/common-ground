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

const clock = () => new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" })

/** An instant as the viewer's clock time: "14:32". */
export const formatTime = (iso: string): string => clock().format(new Date(iso))

const longDay = () =>
  new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long" })

/** A date as Home's welcome writes it: "Tuesday 27 October". */
export const formatLongDay = (date: Date): string => longDay().format(date).replace(",", "")

/** An instant as the day it falls on in the viewer's time zone: "15 Oct 2026". */
export const formatDay = (iso: string): string => day().format(new Date(iso))

/** A date-only value as that calendar day; it never shifts with the viewer's time zone. */
export const formatDateOnly = (date: DateOnly): string =>
  day("UTC").format(new Date(`${date}T00:00:00Z`))
