// What a push says. The wording mirrors the SPA's notification copy
// (src/features/notifications/domain/messages.ts); copy.test.ts fails when the two drift.
// Never content: only who did what kind of thing, as the bell shows it.
const FORMER_MEMBER = "Former member"

export const PUSH_BODIES: Readonly<Record<string, (actor: string) => string>> = {
  invite_accepted: (a) => `${a} joined your space`,
  recommendation: (a) => `${a} recommended something for you`,
  mention: (a) => `${a} mentioned you`,
  task_assigned: (a) => `${a} assigned you a task`,
  ownership_received: (a) => `${a} made you the owner`,
  member_removed: () => "You were removed from a space",
  member_left: (a) => `${a} left your space`,
  note: (a) => `${a} left you a note`,
  note_reply: (a) => `${a} replied to a note`,
  idea_invite: (a) => `${a} invited you to an idea`,
  idea_invite_accepted: (a) => `${a} joined your idea`,
  idea_comment: (a) => `${a} commented on your idea`,
  idea_stage_changed: (a) => `${a} moved your idea`,
  event_invite: (a) => `${a} invited you to a plan`,
  event_rsvp: (a) => `${a} replied to your plan`,
  event_updated: (a) => `${a} changed a plan`,
  event_cancelled: (a) => `${a} cancelled a plan`,
  event_reminder: () => "A plan is coming up",
  hard_talk: (a) => `${a} shared something with you`,
  note_response: (a) => `${a} responded to what you shared`,
  note_nudge: () => "A gentle reminder you asked for: a note is waiting when you're ready",
}

const TITLES: readonly (readonly [RegExp, string])[] = [
  [/^event_/, "Plans"],
  [/^(note|hard_talk)/, "Notes"],
  [/^(idea_|task_|mention)/, "Ideas"],
  [/^recommendation/, "Watch"],
  [/^(invite_|member_|ownership_)/, "Your space"],
]

export interface PushCopy {
  readonly title: string
  readonly body: string
}

export function pushCopy(type: string, actorName: string | null): PushCopy {
  const body = (PUSH_BODIES[type] ?? ((a: string) => `${a} did something`))(
    actorName ?? FORMER_MEMBER,
  )
  const title = TITLES.find(([pattern]) => pattern.test(type))?.[1] ?? "Common Ground"
  return { title, body }
}

const ideaTab = (type: string | undefined) => {
  if (type === "task_assigned") return "tasks"
  return type === "mention" || type === "idea_comment" ? "discussion" : "overview"
}

/** The SPA hash route a push opens, matching the bell's links (subjectHref in the SPA). */
export function pushRoute(
  spaceId: string,
  subjectType: string,
  subjectId: string,
  type?: string,
): string {
  if (type === "member_removed") return "#/"
  const space = `#/s/${spaceId}`
  switch (subjectType) {
    case "watch_item":
      return `${space}/watch/${subjectId}`
    case "idea":
      return `${space}/ideas/${subjectId}/${ideaTab(type)}`
    case "task":
      return `${space}/ideas`
    case "calendar_event":
      return `${space}/calendar/${subjectId}`
    case "profile":
    case "space":
      return `${space}/settings`
    default:
      return `${space}/home`
  }
}
