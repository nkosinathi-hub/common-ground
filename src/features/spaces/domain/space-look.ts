import { normaliseHex } from "./color"

/** How a space looks (D15b, 230:7932 and 230:8397). Absent colours mean the design defaults. */
export interface SpaceLook {
  readonly background: string | null
  readonly card: string | null
  readonly button: string | null
  readonly backgroundStyle: BackgroundStyle
  readonly sidebar: SidebarStyle
  readonly density: Density
  readonly corners: Corners
  readonly headings: HeadingFont
  /** Where the background image's subject sits, 0 to 100 from the left and the top. */
  readonly focusX: number
  readonly focusY: number
}

export const BACKGROUND_STYLES = ["solid", "gradient", "pattern", "image"] as const
export type BackgroundStyle = (typeof BACKGROUND_STYLES)[number]
export const SIDEBAR_STYLES = ["filled", "light"] as const
export type SidebarStyle = (typeof SIDEBAR_STYLES)[number]
export const DENSITIES = ["compact", "comfortable", "spacious"] as const
export type Density = (typeof DENSITIES)[number]
export const CORNERS = ["square", "soft", "rounded"] as const
export type Corners = (typeof CORNERS)[number]
export const HEADING_FONTS = ["serif", "sans"] as const
export type HeadingFont = (typeof HEADING_FONTS)[number]

export interface Swatch {
  readonly name: string
  readonly hex: string
}

/** The Figma swatches; the first of each is the default. */
export const BACKGROUND_SWATCHES: readonly Swatch[] = [
  { name: "Warm paper", hex: "#f7f5ef" },
  { name: "Cloud", hex: "#f2f3f7" },
  { name: "Sage", hex: "#ecf1e8" },
  { name: "Blush", hex: "#f7edea" },
  { name: "Lavender", hex: "#efecfa" },
]
export const CARD_SWATCHES: readonly Swatch[] = [
  { name: "Cream", hex: "#fffefa" },
  { name: "White", hex: "#ffffff" },
  { name: "Paper", hex: "#f3f0e8" },
  { name: "Lilac", hex: "#f7f4fe" },
]
export const BUTTON_SWATCHES: readonly Swatch[] = [
  { name: "Indigo", hex: "#3225a8" },
  { name: "Teal", hex: "#1e6b66" },
  { name: "Forest", hex: "#2f6b3a" },
  { name: "Plum", hex: "#7a2e6b" },
  { name: "Rust", hex: "#a3452e" },
  { name: "Ink", hex: "#26223a" },
]

export const DEFAULT_LOOK: SpaceLook = {
  background: null,
  card: null,
  button: null,
  backgroundStyle: "solid",
  sidebar: "filled",
  density: "comfortable",
  corners: "soft",
  headings: "serif",
  focusX: 50,
  focusY: 50,
}

const pick = <T extends string>(allowed: readonly T[], raw: unknown, fallback: T): T =>
  allowed.find((value) => value === raw) ?? fallback
const colour = (raw: unknown) => (typeof raw === "string" ? normaliseHex(raw) : null)
const percent = (raw: unknown) =>
  typeof raw === "number" && raw >= 0 && raw <= 100 ? Math.round(raw) : 50

/** Reads a stored look; anything unknown or malformed falls back to the default, never throws. */
export function parseLook(raw: unknown): SpaceLook {
  const look = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  return {
    background: colour(look.background),
    card: colour(look.card),
    button: colour(look.button),
    backgroundStyle: pick(BACKGROUND_STYLES, look.backgroundStyle, "solid"),
    sidebar: pick(SIDEBAR_STYLES, look.sidebar, "filled"),
    density: pick(DENSITIES, look.density, "comfortable"),
    corners: pick(CORNERS, look.corners, "soft"),
    headings: pick(HEADING_FONTS, look.headings, "serif"),
    focusX: percent(look.focusX),
    focusY: percent(look.focusY),
  }
}

/** The swatch a colour matches, for the label beside the swatches ("Warm paper"); else "Custom". */
export const swatchName = (swatches: readonly Swatch[], hex: string | null): string =>
  hex === null ? swatches[0]!.name : (swatches.find((s) => s.hex === hex)?.name ?? "Custom")
