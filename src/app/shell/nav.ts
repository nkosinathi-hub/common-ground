import { CalendarDays, Clapperboard, House, Lightbulb } from "@lucide/svelte"
import { buildHash, type Route } from "@/shared/domain"

export type Section = "home" | "watch" | "ideas" | "calendar"

export const SECTIONS = [
  { id: "home", label: "Home", icon: House },
  { id: "watch", label: "Watch", icon: Clapperboard },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
] as const

const SECTION_OF_ROUTE: Partial<Record<Route["name"], Section>> = {
  home: "home",
  watch: "watch",
  "watch-item": "watch",
  ideas: "ideas",
  idea: "ideas",
  calendar: "calendar",
  event: "calendar",
}

/** The primary destination a route belongs to; settings and other pages highlight none. */
export const sectionOf = (name: Route["name"]): Section | null => SECTION_OF_ROUTE[name] ?? null

export const sectionHref = (spaceId: string, section: Section) =>
  buildHash({ name: section, spaceId })
