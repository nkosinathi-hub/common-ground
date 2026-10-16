import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { dueState } from "./upcoming"

const today = "2026-10-15" as DateOnly

describe("upcoming tasks", () => {
  it("classifies against the local calendar day", () => {
    expect(dueState("2026-10-14" as DateOnly, today)).toBe("overdue")
    expect(dueState("2026-10-15" as DateOnly, today)).toBe("today")
    expect(dueState("2026-10-16" as DateOnly, today)).toBe("soon")
  })
})
