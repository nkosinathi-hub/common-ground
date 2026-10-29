import { palette, type Scheme } from "@/shared/domain/design/tokens"
import { fromHsl, mix, normaliseHex, parseHex, toHex, toHsl } from "./color"

export type ColourMode = Scheme

const surfaces = (mode: ColourMode) => {
  const { background, card, foreground } = palette(mode)
  return { background: background!, card: card!, foreground: foreground! }
}

/** The design file's neutral surfaces that an accent must read against. */
export const SURFACES: Readonly<Record<ColourMode, ReturnType<typeof surfaces>>> = {
  light: surfaces("light"),
  dark: surfaces("dark"),
}

/** The CSS variables a custom accent overrides; everything else comes from the preset. */
export const ACCENT_VARS = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--secondary",
  "--secondary-foreground",
] as const
export type AccentVar = (typeof ACCENT_VARS)[number]

export interface AccentTokens {
  readonly vars: Readonly<Record<AccentVar, string>>
  /** True when the chosen colour had to be darkened or lightened to stay readable. */
  readonly adjusted: boolean
}

const AA = 4.5
const STEP = 0.01
const TINT = 0.14

const linear = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of a hex colour. */
export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex)!
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const tint = (primary: string, mode: ColourMode) => mix(primary, SURFACES[mode].background, TINT)

const readable = (primary: string, mode: ColourMode) => {
  const { background, card } = SURFACES[mode]
  const surfaces = [background, card, tint(primary, mode)]
  return surfaces.every((surface) => contrastRatio(primary, surface) >= AA)
}

/** Steps lightness down (light) or up (dark) until the accent reads as text; black and white always do. */
function readablePrimary(hex: string, mode: ColourMode): string {
  const hsl = toHsl(parseHex(hex)!)
  const direction = mode === "light" ? -1 : 1
  let primary = hex
  for (let l = hsl.l; !readable(primary, mode) && l >= 0 && l <= 1; l += direction * STEP)
    primary = toHex(fromHsl({ ...hsl, l: Math.min(1, Math.max(0, l)) }))
  return primary
}

/** The accent's CSS variables for one mode, each pair at least 4.5:1. */
export function accentTokens(hex: string, mode: ColourMode): AccentTokens {
  const chosen = normaliseHex(hex) ?? SURFACES[mode].foreground
  const primary = readablePrimary(chosen, mode)
  const [light, dark] = [SURFACES.light.card, SURFACES.dark.background]
  const foreground = contrastRatio(light, primary) >= contrastRatio(dark, primary) ? light : dark
  return {
    adjusted: primary !== chosen,
    vars: {
      "--primary": primary,
      "--primary-foreground": foreground,
      "--ring": primary,
      "--secondary": tint(primary, mode),
      "--secondary-foreground": primary,
    },
  }
}
