import { describe, expect, it } from "vitest"
import { contrastRatio } from "@/features/spaces/domain/contrast"
import { TEXT_PAIRS } from "@/shared/domain/design/pairs"
import { palette } from "@/shared/domain/design/tokens"

describe("design palette", () => {
  for (const scheme of ["light", "dark"] as const) {
    it(`keeps every text pair at 4.5:1 or more in ${scheme}`, () => {
      const colours = palette(scheme)
      for (const [text, surface] of TEXT_PAIRS)
        expect(
          contrastRatio(colours[text]!, colours[surface]!),
          `${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5)
    })
  }
})
