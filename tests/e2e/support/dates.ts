/** A calendar day some days from today, so date rules that refuse the past never expire a test. */
export function daysFromNow(days: number): { iso: string; shown: string } {
  const now = new Date()
  const day = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days))
  const iso = day.toISOString().slice(0, 10)
  // Same format as formatDateOnly in src/shared/domain/format.ts (en-ZA, UTC).
  const shown = new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(day)
  return { iso, shown }
}
