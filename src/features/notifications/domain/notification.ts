import { buildHash, FORMER_MEMBER } from "@/shared/domain"

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

const MESSAGES: Record<string, (actor: string) => string> = {
  invite_accepted: (actor) => `${actor} joined your space`,
  recommendation: (actor) => `${actor} recommended something for you`,
  mention: (actor) => `${actor} mentioned you`,
  task_assigned: (actor) => `${actor} assigned you a task`,
  ownership_received: (actor) => `${actor} made you the owner`,
  member_removed: (actor) => `${actor} removed a member`,
}

const SOMETHING = (actor: string) => `${actor} did something`

export function describeNotification(note: Pick<Notification, "type" | "actorName">): string {
  return (MESSAGES[note.type] ?? SOMETHING)(who(note.actorName))
}

const ACTIVITY: Record<string, string> = {
  space_created: "created the space",
  member_joined: "joined",
  member_left: "left",
  watch_item_added: "added a title",
  watched_together: "logged a watch together",
  idea_created: "captured an idea",
  idea_stage_changed: "moved an idea",
  task_completed: "finished a task",
}

export function describeActivity(event: Pick<ActivityEvent, "eventType" | "actorName">): string {
  const action = ACTIVITY[event.eventType] ?? event.eventType.replaceAll("_", " ")
  return `${who(event.actorName)} ${action}`
}

/** Where a notification leads. Unknown subjects fall back to the space home. */
export function subjectHref(spaceId: string, subjectType: string, subjectId: string): string {
  switch (subjectType) {
    case "watch_item":
      return buildHash({ name: "watch-item", spaceId, itemId: subjectId })
    case "idea":
      return buildHash({ name: "idea", spaceId, ideaId: subjectId, tab: "overview" })
    case "task":
      return buildHash({ name: "ideas", spaceId })
    case "profile":
    case "space":
      return buildHash({ name: "settings", spaceId })
    default:
      return buildHash({ name: "home", spaceId })
  }
}

export const unreadCount = (items: readonly Notification[]) =>
  items.filter((note) => !note.readAt).length
