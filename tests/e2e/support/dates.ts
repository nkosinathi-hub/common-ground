/** A calendar day some days from today, so date rules that refuse the past never expire a test. */
export function daysFromNow(days: number): { iso: string; shown: string } {
  const now = new Date()
  const day = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days))
  const iso = day.toISOString().slice(0, 10)
  // Same format as formatDue in src/features/tasks/domain/task.ts (en-GB, UTC).
  const shown = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(day)
  return { iso, shown }
}
