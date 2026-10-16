import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { isTimeZone, localDay, localTime, timeZones, toInstant } from "./zone"

const d = (value: string) => value as DateOnly

describe("time zones", () => {
  it("accepts IANA names and refuses abbreviations, offsets and Etc zones", () => {
    expect(isTimeZone("Pacific/Auckland")).toBe(true)
    expect(isTimeZone("America/Argentina/Buenos_Aires")).toBe(true)
    expect(isTimeZone("UTC")).toBe(true)
    for (const zone of ["EST", "Etc/GMT+5", "+02:00", "Mars/Olympus", "", "Europe/"])
      expect(isTimeZone(zone)).toBe(false)
  })

  it("turns a wall-clock time in a zone into an instant, across DST changes", () => {
    expect(toInstant(d("2026-10-16"), "19:00", "Pacific/Auckland")).toBe("2026-10-16T06:00:00.000Z")
    expect(toInstant(d("2026-01-16"), "19:00", "Europe/London")).toBe("2026-01-16T19:00:00.000Z")
    expect(toInstant(d("2026-07-16"), "19:00", "Europe/London")).toBe("2026-07-16T18:00:00.000Z")
    // London springs forward on 29 March 2026: 01:30 does not exist and moves on an hour.
    expect(toInstant(d("2026-03-29"), "01:30", "Europe/London")).toBe("2026-03-29T01:30:00.000Z")
    expect(toInstant(d("2026-03-29"), "03:00", "Europe/London")).toBe("2026-03-29T02:00:00.000Z")
    // And falls back on 25 October 2026: 01:30 happens twice; the later one is used.
    expect(toInstant(d("2026-10-25"), "01:30", "Europe/London")).toBe("2026-10-25T01:30:00.000Z")
    expect(toInstant(d("2026-10-25"), "12:00", "Europe/London")).toBe("2026-10-25T12:00:00.000Z")
  })

  it("reads an instant as a local day and time in any zone", () => {
    const instant = "2026-10-16T06:00:00Z"
    expect(localDay(instant, "Pacific/Auckland")).toBe("2026-10-16")
    expect(localTime(instant, "Pacific/Auckland")).toBe("19:00")
    expect(localDay(instant, "America/Los_Angeles")).toBe("2026-10-15")
    expect(localTime(instant, "America/Los_Angeles")).toBe("23:00")
    expect(localTime("2026-10-16T00:00:00Z", "UTC")).toBe("00:00")
  })

  it("lists the zones to choose from, keeping the current one", () => {
    const zones = timeZones("Asia/Calcutta")
    expect(zones).toContain("Europe/London")
    expect(zones).toContain("Asia/Calcutta")
    expect(zones).toContain("UTC")
    expect(new Set(zones).size).toBe(zones.length)
  })
})
