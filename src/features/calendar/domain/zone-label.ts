import { offsetMs } from "./zone"

/** "UTC+2", "UTC+5:30", "UTC-3" or plain "UTC": a zone's offset at an instant. */
export function utcOffset(zone: string, at: number): string {
  const minutes = Math.round(offsetMs(at, zone) / 60_000)
  if (minutes === 0) return "UTC"
  const sign = minutes > 0 ? "+" : "-"
  const hours = Math.floor(Math.abs(minutes) / 60)
  const rest = Math.abs(minutes) % 60
  return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`
}

/** The place a zone is named after: "Africa/Johannesburg" is "Johannesburg". */
export const zoneCity = (zone: string): string => zone.split("/").at(-1)!.replaceAll("_", " ")

/** "Ana & Ben", "Ana, Ben & Cat"; nobody gives an empty string. */
export function peopleLine(names: readonly string[]): string {
  if (names.length < 2) return names[0] ?? ""
  return `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`
}
