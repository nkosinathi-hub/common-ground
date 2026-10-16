import { buildHash } from "@/shared/domain"
import type { CalendarEntry, EventLink } from "../domain"

const ideaTab = (spaceId: string, ideaId: string, tab: "overview" | "tasks" | "milestones") =>
  buildHash({ name: "idea", spaceId, ideaId, tab })

/** Events open on their own page; task due dates and milestones on their idea's tab. */
export function entryHref(spaceId: string, entry: CalendarEntry): string {
  if (entry.kind === "task" && entry.ideaId) return ideaTab(spaceId, entry.ideaId, "tasks")
  if (entry.kind === "milestone" && entry.ideaId)
    return ideaTab(spaceId, entry.ideaId, "milestones")
  return buildHash({ name: "event", spaceId, eventId: entry.id })
}

/** Where an event's linked item lives, or null when it cannot be opened. */
export function linkHref(spaceId: string, link: EventLink): string | null {
  if (link.kind === "watch_item") return buildHash({ name: "watch-item", spaceId, itemId: link.id })
  if (link.kind === "idea") return ideaTab(spaceId, link.id, "overview")
  return link.ideaId ? ideaTab(spaceId, link.ideaId, "tasks") : null
}
