import { DEFAULT_HOME_CARDS, HOME_CARDS, type HomeCardId } from "@/shared/domain"
import { DEFAULT_LOOK, type SpaceLook } from "./space-look"

export type DefaultWatchIntent = "want_to_watch" | "watch_together"
export type WeekStart = 0 | 1

/** What the owner sets about a space beyond its name and template. */
export interface SpaceProfile {
  readonly tagline: string
  readonly description: string
  /** Colours, background, sidebar, density, corners and heading font (D15b). */
  readonly look: SpaceLook
  /** A key from SPACE_ICONS, or null for the space's initial. */
  readonly icon: string | null
  readonly avatarPath: string | null
  readonly coverPath: string | null
  /** The background picture, used when the look's background style is image. */
  readonly backgroundPath: string | null
  readonly homeCards: readonly HomeCardId[]
  readonly defaultWatchIntent: DefaultWatchIntent
  readonly weekStartsOn: WeekStart
}

/** The database defaults for a new space. */
export const DEFAULT_PROFILE: SpaceProfile = {
  tagline: "",
  description: "",
  look: DEFAULT_LOOK,
  icon: null,
  avatarPath: null,
  coverPath: null,
  backgroundPath: null,
  homeCards: DEFAULT_HOME_CARDS,
  defaultWatchIntent: "want_to_watch",
  weekStartsOn: 1,
}

/** Known cards only, each once, in the order given. */
export const homeCardsOf = (raw: readonly string[]): HomeCardId[] => [
  ...new Set(raw.filter((id): id is HomeCardId => HOME_CARDS.some((known) => known === id))),
]

/** Only what differs from the default is stored, so a later default change reaches everyone. */
export function storedLook(look: SpaceLook): Partial<SpaceLook> {
  return Object.fromEntries(
    Object.entries(look).filter(
      ([key, value]) => value !== null && value !== DEFAULT_LOOK[key as keyof SpaceLook],
    ),
  )
}
