import { palette as designPalette, type Scheme } from "@/shared/domain/design/tokens"
import { fromHsl, mix, parseHex, toHex, toHsl } from "./color"
import { contrastRatio, nudgeToContrast } from "./contrast"
import type { SpaceLook } from "./space-look"

/** A space's colours for one scheme: CSS variables, and the picks moved to stay readable. */
export interface SpacePalette {
  readonly vars: Readonly<Record<string, string>>
  readonly adjusted: readonly ("button" | "surface")[]
}

const AA = 4.5
const hsl = (h: number, s: number, l: number) => toHex(fromHsl({ h, s, l }))
const hueOf = (hex: string) => toHsl(parseHex(hex)!)

function lightColours(look: SpaceLook, d: Record<string, string>) {
  // A surface too dark for the text lightens until the text reads on it.
  const text = () => [d.foreground!]
  const background = nudgeToContrast(look.background ?? d.background!, text, "lighter")
  const card = nudgeToContrast(look.card ?? d.card!, text, "lighter")
  const chosen = look.button ?? d.primary!
  const tint = (primary: string) => mix(primary, card, 0.1)
  const primary = nudgeToContrast(chosen, (p) => [background, card, tint(p)], "darker")
  const neutral = mix(d.foreground!, card, 0.08)
  return {
    background,
    card,
    primary,
    secondary: tint(primary),
    muted: nudgeToContrast(mix(d.foreground!, background, 0.04), text, "lighter"),
    border: mix(primary, neutral, 0.06),
    onPrimary: d["primary-foreground"]!,
    mutedText: d["muted-foreground"]!,
    moved: primary !== chosen,
    surfaceMoved:
      background !== (look.background ?? d.background) || card !== (look.card ?? d.card),
  }
}

/** Dark surfaces take the button's hue, as the indigo default does (Figma D24). */
function darkColours(look: SpaceLook) {
  const { h, s } = hueOf(look.button!)
  const background = hsl(h, 0.27, 0.115)
  const card = hsl(h, 0.22, 0.17)
  const chosen = hsl(h, Math.min(s, 0.72), 0.89)
  const tint = (primary: string) => mix(primary, card, 0.17)
  const primary = nudgeToContrast(chosen, (p) => [background, card, tint(p)], "lighter")
  return {
    background,
    card,
    primary,
    secondary: tint(primary),
    muted: hsl(h, 0.29, 0.22),
    border: hsl(h, 0.18, 0.25),
    onPrimary: background,
    mutedText: hsl(h, 0.18, 0.74),
    moved: false,
    surfaceMoved: false,
  }
}

/**
 * The CSS variables for a look in one scheme. Nothing chosen gives no variables: the generated
 * design tokens apply untouched. Every text colour is checked against every surface it sits on.
 */
export function paletteFor(look: SpaceLook, scheme: Scheme): SpacePalette {
  const d = designPalette(scheme)
  const custom = scheme === "light" ? look.background || look.card || look.button : look.button
  const vars: Record<string, string> = {}
  const adjusted: SpacePalette["adjusted"][number][] = []
  if (custom) {
    const c = scheme === "light" ? lightColours(look, d) : darkColours(look)
    const surfaces = () => [c.background, c.card, c.muted, c.secondary]
    const away = scheme === "light" ? "darker" : "lighter"
    const mutedText = nudgeToContrast(c.mutedText, surfaces, away)
    Object.assign(vars, {
      "--background": c.background,
      "--card": c.card,
      "--primary": c.primary,
      "--ring": c.primary,
      "--secondary": c.secondary,
      "--secondary-foreground": c.primary,
      "--muted": c.muted,
      "--border": c.border,
      "--muted-foreground": mutedText,
      "--destructive": nudgeToContrast(d.destructive!, () => [c.background, c.card], away),
      "--primary-foreground":
        contrastRatio(c.onPrimary, c.primary) >= AA ? c.onPrimary : d.foreground!,
    })
    if (c.moved) adjusted.push("button")
    if (c.surfaceMoved) adjusted.push("surface")
  }
  if (look.sidebar === "light")
    Object.assign(vars, { "--sidebar": "var(--card)", "--sidebar-foreground": "var(--foreground)" })
  return { vars, adjusted }
}
