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

const shortDay = () =>
  new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })

/** A date-only value as a log row reads it: "Sat 24 Oct". */
export const formatShortDay = (date: DateOnly): string =>
  shortDay()
    .format(new Date(`${date}T00:00:00Z`))
    .replace(",", "")

const HOUR = 3_600_000
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const weekday = () => new Intl.DateTimeFormat(LOCALE, { weekday: "short" })
const dayMonth = () => new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" })

/** A comment's age as people say it: "Just now", "2 h ago", "Yesterday", "Mon", "24 Oct". */
export function formatAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso)
  const ms = now.getTime() - then.getTime()
  if (ms < 60_000) return "Just now"
  if (ms < HOUR) return `${Math.floor(ms / 60_000)} min ago`
  const days = Math.round((dayStart(now) - dayStart(then)) / (24 * HOUR))
  if (days === 0) return `${Math.floor(ms / HOUR)} h ago`
  if (days === 1) return "Yesterday"
  return days < 7 ? weekday().format(then) : dayMonth().format(then)
}
