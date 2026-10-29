import { Cake, CalendarDays, Flag, SquareCheck } from "@lucide/svelte"
import type { EntryKind } from "../domain"

/** Each entry kind's icon, and the words a screen reader hears before its title. */
export const KINDS: Record<EntryKind, { icon: typeof Cake; label: string }> = {
  event: { icon: CalendarDays, label: "Event" },
  occasion: { icon: Cake, label: "Every year" },
  task: { icon: SquareCheck, label: "Task due" },
  milestone: { icon: Flag, label: "Milestone" },
}

/** Names a set of user ids as a sentence: "Ana & Ben". */
export type Who = (userIds: readonly string[]) => string
