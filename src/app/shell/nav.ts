import { Calendar, House, Lightbulb, NotebookPen, Tv } from "@lucide/svelte"
import { buildHash, type Route } from "@/shared/domain"

/** Stable destinations across the floating bar, tablet row and phone dock. */
export type Section = "home" | "watch" | "ideas" | "notes" | "calendar" | "settings" | "account"
export type MainSection = Exclude<Section, "settings" | "account">

/** Primary destinations; page actions are supplied separately by the current page. */
export const SECTIONS = [
  { id: "home", label: "Home", icon: House },
  { id: "watch", label: "Watch", icon: Tv },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "calendar", label: "Calendar", icon: Calendar },
] as const

const SECTION_OF_ROUTE: Partial<Record<Route["name"], Section>> = {
  home: "home",
  notes: "notes",
  note: "notes",
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
