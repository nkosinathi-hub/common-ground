import { describe, expect, it } from "vitest"
import type { DateOnly } from "@/shared/domain"
import { gridMove, monthGrid } from "./month"

const d = (value: string) => value as DateOnly

describe("monthGrid", () => {
  it("is six weeks starting on Monday by default", () => {
    const grid = monthGrid(2026, 10)
    expect(grid).toHaveLength(42)
    expect(grid[0]).toBe("2026-09-28")
    expect(grid[3]).toBe("2026-10-01")
    expect(grid[41]).toBe("2026-11-08")
  })

  it("starts on Sunday when the space says so, even when the 1st is a Sunday", () => {
    expect(monthGrid(2026, 10, 0)[0]).toBe("2026-09-27")
    expect(monthGrid(2026, 11, 0)[0]).toBe("2026-11-01")
    expect(monthGrid(2026, 6, 1)[0]).toBe("2026-06-01")
  })
})

describe("gridMove", () => {
  const at = d("2026-10-16")
  it("moves by day, week, month and to the ends of the week", () => {
    expect(gridMove(at, "ArrowRight", 1)).toBe("2026-10-17")
    expect(gridMove(at, "ArrowLeft", 1)).toBe("2026-10-15")
    expect(gridMove(at, "ArrowDown", 1)).toBe("2026-10-23")
    expect(gridMove(at, "ArrowUp", 1)).toBe("2026-10-09")
    expect(gridMove(at, "Home", 1)).toBe("2026-10-12")
    expect(gridMove(at, "End", 1)).toBe("2026-10-18")
    expect(gridMove(at, "Home", 0)).toBe("2026-10-11")
    expect(gridMove(at, "End", 0)).toBe("2026-10-17")
    expect(gridMove(at, "PageDown", 1)).toBe("2026-11-16")
    expect(gridMove(at, "PageUp", 1)).toBe("2026-09-16")
    expect(gridMove(d("2026-01-31"), "PageDown", 1)).toBe("2026-02-28")
    expect(gridMove(at, "Enter", 1)).toBeNull()
  })
})
