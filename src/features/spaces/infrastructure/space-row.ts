import type { Database } from "@/shared/infrastructure/database.types"
import type { SpaceProfilePatch } from "../application/ports"
import { homeCardsOf, toPreset } from "../domain/look"
import { isSpaceIcon } from "../domain/profile"
import type { Space, SpaceRole } from "../domain/space"

type SpaceTable = Database["public"]["Tables"]["spaces"]
export type SpaceRow = Pick<
  SpaceTable["Row"],
  | "id"
  | "name"
  | "template"
  | "tagline"
  | "description"
  | "theme"
  | "accent_color"
  | "icon"
  | "avatar_path"
  | "cover_path"
  | "home_cards"
  | "default_watch_intent"
  | "week_starts_on"
>

export const toSpace = (row: SpaceRow, role: SpaceRole): Space => ({
  id: row.id,
  name: row.name,
  template: row.template,
  role,
  tagline: row.tagline,
  description: row.description,
  theme: toPreset(row.theme),
  accent: row.accent_color,
  icon: isSpaceIcon(row.icon) ? row.icon : null,
  avatarPath: row.avatar_path,
  coverPath: row.cover_path,
  homeCards: homeCardsOf(row.home_cards),
  defaultWatchIntent:
    row.default_watch_intent === "watch_together" ? "watch_together" : "want_to_watch",
  weekStartsOn: row.week_starts_on === 0 ? 0 : 1,
})

const COLUMN_OF = {
  name: "name",
  template: "template",
  tagline: "tagline",
  description: "description",
  icon: "icon",
  theme: "theme",
  accent: "accent_color",
  homeCards: "home_cards",
  defaultWatchIntent: "default_watch_intent",
  weekStartsOn: "week_starts_on",
} as const satisfies Record<keyof SpaceProfilePatch, keyof SpaceTable["Update"]>

/** The update for the fields a patch names; untouched columns stay out of the request. */
export function profileColumns(patch: SpaceProfilePatch): SpaceTable["Update"] {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined)
  return Object.fromEntries(
    entries.map(([field, value]) => [COLUMN_OF[field as keyof SpaceProfilePatch], value]),
  )
}
