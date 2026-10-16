import { DEFAULT_HOME_CARDS, HOME_CARDS, type HomeCardId } from "@/shared/domain"
import { accentTokens, type AccentVar, type ColourMode } from "./contrast"
import type { SpaceTemplateId } from "./templates"

/** Colour presets, independent of the template; null on a space means follow the template. */
export const SPACE_PRESETS = [
  "blank",
  "couple",
  "friends",
  "family",
  "ocean",
  "meadow",
  "dusk",
  "berry",
] as const
export type SpacePreset = (typeof SPACE_PRESETS)[number]

export const PRESET_LABELS: Readonly<Record<SpacePreset, string>> = {
  blank: "Sage",
  couple: "Rose",
  friends: "Lavender",
  family: "Honey",
  ocean: "Ocean",
  meadow: "Meadow",
  dusk: "Dusk",
  berry: "Berry",
}

export type DefaultWatchIntent = "want_to_watch" | "watch_together"
export type WeekStart = 0 | 1

/** What the owner sets about a space beyond its name and template. */
export interface SpaceProfile {
  readonly tagline: string
  readonly description: string
  readonly theme: SpacePreset | null
  /** Lowercase #rrggbb, or null for the preset's own accent. */
  readonly accent: string | null
  /** A key from SPACE_ICONS, or null for the space's initial. */
  readonly icon: string | null
  readonly avatarPath: string | null
  readonly coverPath: string | null
  readonly homeCards: readonly HomeCardId[]
  readonly defaultWatchIntent: DefaultWatchIntent
  readonly weekStartsOn: WeekStart
}

/** The database defaults for a new space. */
export const DEFAULT_PROFILE: SpaceProfile = {
  tagline: "",
  description: "",
  theme: null,
  accent: null,
  icon: null,
  avatarPath: null,
  coverPath: null,
  homeCards: DEFAULT_HOME_CARDS,
  defaultWatchIntent: "want_to_watch",
  weekStartsOn: 1,
}

export const toPreset = (raw: string | null | undefined): SpacePreset | null =>
  SPACE_PRESETS.find((preset) => preset === raw) ?? null

export const presetOf = (space: {
  readonly theme: SpacePreset | null
  readonly template: SpaceTemplateId
}): SpacePreset => space.theme ?? space.template

/** Known cards only, each once, in the order given. */
export const homeCardsOf = (raw: readonly string[]): HomeCardId[] => [
  ...new Set(raw.filter((id): id is HomeCardId => HOME_CARDS.some((known) => known === id))),
]

export interface SpaceLook {
  readonly preset: SpacePreset
  /** Inline CSS variables for a custom accent; empty when the preset alone applies. */
  readonly vars: Partial<Record<AccentVar, string>>
  readonly adjusted: boolean
}

type LookSource = Pick<SpaceProfile, "theme" | "accent"> & { readonly template: SpaceTemplateId }

export function lookOf(space: LookSource, mode: ColourMode): SpaceLook {
  const preset = presetOf(space)
  if (!space.accent) return { preset, vars: {}, adjusted: false }
  const { vars, adjusted } = accentTokens(space.accent, mode)
  return { preset, vars, adjusted }
}
