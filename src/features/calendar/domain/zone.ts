import type { DateOnly } from "@/shared/domain"
import { dateOf } from "./days"

// Same rule as public.is_iana_time_zone: region names only, no abbreviations or Etc offsets.
const IANA = /^[A-Za-z]+(\/[A-Za-z0-9_+-]+)*$/
const REFUSED = /^(Etc|posix|right)\//
const ABBREVIATIONS = new Set(["EST", "MST", "HST"])

export function isTimeZone(zone: string): boolean {
  if (!IANA.test(zone) || REFUSED.test(zone) || ABBREVIATIONS.has(zone)) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone })
    return true
  } catch {
    return false
  }
}

/** The zones a person can pick, with `current` kept even if Intl lists it under another name. */
export function timeZones(current: string): string[] {
  const listed = Intl.supportedValuesOf("timeZone").filter(isTimeZone)
  return [...new Set([...listed, "UTC", current])].sort()
}

const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(zone: string): Intl.DateTimeFormat {
  let found = formatters.get(zone)
  if (!found) {
    found = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
    formatters.set(zone, found)
  }
  return found
}

function wallClock(ms: number, zone: string) {
  const parts = formatter(zone).formatToParts(ms)
  const part = (type: string) => Number(parts.find((p) => p.type === type)!.value)
  return { y: part("year"), m: part("month"), d: part("day"), h: part("hour"), min: part("minute") }
}

const minuteOf = (ms: number) => Math.floor(ms / 60_000) * 60_000

/** How far the zone's wall clock is ahead of UTC at an instant, in milliseconds. */
export function offsetMs(ms: number, zone: string): number {
  const w = wallClock(ms, zone)
  return Date.UTC(w.y, w.m - 1, w.d, w.h, w.min) - minuteOf(ms)
}

const asMs = (instant: string | number) =>
  typeof instant === "number" ? instant : Date.parse(instant)

export function localDay(instant: string | number, zone: string): DateOnly {
  const w = wallClock(asMs(instant), zone)
  return dateOf(w.y, w.m, w.d)
}

export function localTime(instant: string | number, zone: string): string {
  const w = wallClock(asMs(instant), zone)
  return `${String(w.h).padStart(2, "0")}:${String(w.min).padStart(2, "0")}`
}

/**
 * The instant of a wall-clock time ("HH:MM") on a day in a zone. A time skipped by a DST change
 * moves on by the change; a time that happens twice resolves to the later instant.
 */
export function toInstant(day: DateOnly, time: string, zone: string): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number]
  const [h, min] = time.split(":").map(Number) as [number, number]
  const wall = Date.UTC(y, m - 1, d, h, min)
  const guess = offsetMs(wall, zone)
  let ms = wall - guess
  const actual = offsetMs(ms, zone)
  if (actual !== guess) ms = wall - actual
  return new Date(ms).toISOString()
}

/** The instant a local day starts in a zone. */
export const startOfDay = (day: DateOnly, zone: string): number =>
  Date.parse(toInstant(day, "00:00", zone))
