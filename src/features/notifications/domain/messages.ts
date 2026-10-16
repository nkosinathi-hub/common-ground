/** Notification copy by kind; every kind the database sends needs an entry. */
export const MESSAGES: Record<string, (actor: string) => string> = {
  invite_accepted: (actor) => `${actor} joined your space`,
  recommendation: (actor) => `${actor} recommended something for you`,
  mention: (actor) => `${actor} mentioned you`,
  task_assigned: (actor) => `${actor} assigned you a task`,
  ownership_received: (actor) => `${actor} made you the owner`,
  // The removed person can no longer read the actor's profile, so the copy stays generic.
  member_removed: () => "You were removed from a space",
  member_left: (actor) => `${actor} left your space`,
  note: (actor) => `${actor} left you a note`,
  note_reply: (actor) => `${actor} replied to a note`,
  idea_invite: (actor) => `${actor} invited you to an idea`,
  idea_invite_accepted: (actor) => `${actor} joined your idea`,
  idea_comment: (actor) => `${actor} commented on your idea`,
  idea_stage_changed: (actor) => `${actor} moved your idea`,
  event_invite: (actor) => `${actor} invited you to a plan`,
  event_rsvp: (actor) => `${actor} replied to your plan`,
  event_updated: (actor) => `${actor} changed a plan`,
  event_cancelled: (actor) => `${actor} cancelled a plan`,
  event_reminder: () => "A plan is coming up",
}

/** Activity feed verbs by event type; the actor's name is prefixed. */
export const ACTIVITY: Record<string, string> = {
  space_created: "created the space",
  member_joined: "joined",
  member_left: "left",
  watch_item_added: "added a title",
  watched_together: "logged a watch together",
  idea_created: "captured an idea",
  idea_stage_changed: "moved an idea",
  task_created: "added a task",
  task_completed: "finished a task",
  milestone_completed: "reached a milestone",
  space_customised: "refreshed the space",
  idea_collaborator_joined: "joined an idea",
  event_created: "planned something",
}
