import { appError, err, ok, type Result } from "./result"

export type DateOnly = string & { readonly __brand: "DateOnly" }

export function isDateOnly(value: string): value is DateOnly {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

export function toDateOnly(value: string): Result<DateOnly> {
  return isDateOnly(value) ? ok(value) : err(appError("validation", "Use a date like 2026-10-15"))
}

const pad = (n: number) => String(n).padStart(2, "0")

export function todayDateOnly(now = new Date()): DateOnly {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` as DateOnly
}

export const compareDateOnly = (a: DateOnly | string, b: DateOnly | string): number =>
  a < b ? -1 : a > b ? 1 : 0
