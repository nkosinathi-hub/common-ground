import { palette } from "@/shared/domain/design/tokens"
import { normaliseHex } from "./color"
import { contrastRatio, nudgeToContrast } from "./contrast"
import type { SpaceLook } from "./space-look"

export type PickKind = "background" | "card" | "button"

export interface PickCheck {
  /** The weakest contrast the pick makes with what it meets, rounded down to one decimal. */
  readonly ratio: number
  readonly passes: boolean
  /** The nearest colour that passes, offered as "Use #a26813 (4.6:1)"; null when it passes. */
  readonly fix: { readonly hex: string; readonly ratio: number } | null
}

const AA = 4.5
const floor1 = (value: number) => Math.floor(value * 10) / 10

/** What a pick must read against: a button against the surfaces, a surface against the text. */
function against(kind: PickKind, look: SpaceLook): readonly string[] {
  const d = palette("light")
  if (kind === "button") return [look.background ?? d.background!, look.card ?? d.card!]
  return [d.foreground!]
}

/** The custom colour picker's contrast line (Figma 239:9280 and 239:9683). */
export function checkPick(kind: PickKind, raw: string, look: SpaceLook): PickCheck | null {
  const hex = normaliseHex(raw)
  if (!hex) return null
  const others = against(kind, look)
  const weakest = (colour: string) => Math.min(...others.map((o) => contrastRatio(colour, o)))
  const ratio = weakest(hex)
  if (ratio >= AA) return { ratio: floor1(ratio), passes: true, fix: null }
  const fixed = nudgeToContrast(hex, () => others, kind === "button" ? "darker" : "lighter")
  return { ratio: floor1(ratio), passes: false, fix: { hex: fixed, ratio: floor1(weakest(fixed)) } }
}
