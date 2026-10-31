import { describe, expect, it } from "vitest"
import { tabOf } from "./event-tabs"

describe("tabOf", () => {
  it("sends each refused field to the tab that holds it", () => {
    expect(tabOf("title")).toBe("details")
    expect(tabOf("reminders")).toBe("details")
    expect(tabOf("endTime")).toBe("when")
    expect(tabOf("repeatsYearly")).toBe("when")
    expect(tabOf("attendees")).toBe("people")
    expect(tabOf(null)).toBe("details")
  })
})
