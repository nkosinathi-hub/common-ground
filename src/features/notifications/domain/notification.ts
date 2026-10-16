import { buildHash, FORMER_MEMBER, type IdeaTab } from "@/shared/domain"
import { ACTIVITY, MESSAGES } from "./messages"

export interface Notification {
  readonly id: string
  readonly spaceId: string
  readonly type: string
  readonly subjectType: string
  readonly subjectId: string
  readonly actorName: string | null
  readonly readAt: string | null
  readonly createdAt: string
}

export interface ActivityEvent {
  readonly id: string
  readonly eventType: string
  readonly subjectType: string
  readonly subjectId: string
  readonly actorName: string | null
  readonly createdAt: string
}

const who = (name: string | null) => name ?? FORMER_MEMBER

const SOMETHING = (actor: string) => `${actor} did something`

export function describeNotification(note: Pick<Notification, "type" | "actorName">): string {
  return (MESSAGES[note.type] ?? SOMETHING)(who(note.actorName))
}

export function describeActivity(event: Pick<ActivityEvent, "eventType" | "actorName">): string {
  const action = ACTIVITY[event.eventType] ?? event.eventType.replaceAll("_", " ")
  return `${who(event.actorName)} ${action}`
}

/** Assignments open the idea's tasks; mentions and comments open its discussion. */
function ideaTabFor(type: string | undefined): IdeaTab {
  if (type === "task_assigned") return "tasks"
  return type === "mention" || type === "idea_comment" ? "discussion" : "overview"
}

/** Where a notification leads. Unknown subjects fall back to the space home. */
export function subjectHref(
  spaceId: string,
  subjectType: string,
  subjectId: string,
  type?: string,
): string {
  if (type === "member_removed") return buildHash({ name: "entry" })
  switch (subjectType) {
    case "watch_item":
      return buildHash({ name: "watch-item", spaceId, itemId: subjectId })
    case "idea":
      return buildHash({ name: "idea", spaceId, ideaId: subjectId, tab: ideaTabFor(type) })
    case "task":
      return buildHash({ name: "ideas", spaceId })
    case "calendar_event":
      return buildHash({ name: "event", spaceId, eventId: subjectId })
    case "profile":
    case "space":
      return buildHash({ name: "settings", spaceId })
    default:
      return buildHash({ name: "home", spaceId })
  }
}

export const unreadCount = (items: readonly Notification[]) =>
  items.filter((note) => !note.readAt).length
