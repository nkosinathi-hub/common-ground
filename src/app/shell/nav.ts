import { Clapperboard, House, Lightbulb } from "@lucide/svelte"
import { buildHash } from "@/shared/domain"

export type Section = "home" | "watch" | "ideas"

export const SECTIONS = [
  { id: "home", label: "Home", icon: House },
  { id: "watch", label: "Watch", icon: Clapperboard },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
] as const

export const sectionHref = (spaceId: string, section: Section) =>
  buildHash({ name: section, spaceId })
