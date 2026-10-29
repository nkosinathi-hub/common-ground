import { Calendar, House, Lightbulb, Tv } from "@lucide/svelte"
import { buildHash, type Route } from "@/shared/domain"

/** Where a route sits in the shell: one of the four sections, Space settings, or Account. */
export type Section = "home" | "watch" | "ideas" | "calendar" | "settings" | "account"
export type MainSection = Exclude<Section, "settings" | "account">

/** The four primary destinations (Figma rail and tab bar). */
export const SECTIONS = [
  { id: "home", label: "Home", icon: House },
  { id: "watch", label: "Watch", icon: Tv },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "calendar", label: "Calendar", icon: Calendar },
] as const

const SECTION_OF_ROUTE: Partial<Record<Route["name"], Section>> = {
  home: "home",
  notes: "home",
  note: "home",
  watch: "watch",
  "watch-item": "watch",
  party: "watch",
  ideas: "ideas",
  idea: "ideas",
  calendar: "calendar",
  event: "calendar",
  settings: "settings",
  account: "account",
  privacy: "account",
}

export const sectionOf = (name: Route["name"]): Section | null => SECTION_OF_ROUTE[name] ?? null

export const sectionHref = (spaceId: string, section: MainSection) =>
  buildHash({ name: section, spaceId })
