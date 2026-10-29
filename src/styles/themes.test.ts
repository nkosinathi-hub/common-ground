import { describe, expect, it } from "vitest"
import { contrastRatio } from "@/features/spaces/domain/contrast"
import { palette } from "@/shared/domain/design/tokens"

/** Every text colour the design puts on a surface, as [text, surface]. */
const PAIRS: readonly [string, string][] = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["foreground", "muted"],
  ["foreground", "secondary"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "secondary"],
  ["primary", "background"],
  ["primary", "card"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["destructive", "background"],
  ["destructive", "card"],
  ["destructive-foreground", "destructive"],
  ["on-brand", "brand"],
  ["sidebar-foreground", "sidebar"],
]

describe("design palette", () => {
  for (const scheme of ["light", "dark"] as const) {
    it(`keeps every text pair at 4.5:1 or more in ${scheme}`, () => {
      const colours = palette(scheme)
      for (const [text, surface] of PAIRS)
        expect(
          contrastRatio(colours[text]!, colours[surface]!),
          `${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5)
    })
  }
})
