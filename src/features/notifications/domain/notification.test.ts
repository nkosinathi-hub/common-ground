import { describe, expect, it } from "vitest"
import {
  describeActivity,
  describeNotification,
  subjectHref,
  unreadCount,
  type Notification,
} from "./notification"

const n = (over: Partial<Notification>): Notification => ({
  id: "1",
  spaceId: "s",
  type: "mention",
  subjectType: "comment",
  subjectId: "c",
  actorName: "Ana",
  readAt: null,
  createdAt: "2026-10-15T10:00:00Z",
  ...over,
})

describe("notifications", () => {
  it("describes known and unknown types, and former members", () => {
    expect(describeNotification(n({}))).toBe("Ana mentioned you")
    expect(describeNotification(n({ type: "task_assigned", actorName: null }))).toBe(
      "Former member assigned you a task",
    )
    expect(describeNotification(n({ type: "member_left" }))).toBe("Ana left your space")
    expect(describeNotification(n({ type: "weird" }))).toBe("Ana did something")
  })

  it("links subjects to their screens", () => {
    expect(subjectHref("s", "watch_item", "w")).toBe("#/s/s/watch/w")
    expect(subjectHref("s", "idea", "i")).toBe("#/s/s/ideas/i/overview")
    expect(subjectHref("s", "task", "t")).toBe("#/s/s/ideas")
    expect(subjectHref("s", "space", "s")).toBe("#/s/s/settings")
    expect(subjectHref("s", "comment", "c")).toBe("#/s/s/home")
    expect(subjectHref("s", "space_note", "n")).toBe("#/s/s/home")
    expect(subjectHref("s", "calendar_event", "e")).toBe("#/s/s/calendar/e")
  })

  it("sends a removed member to their spaces, since the old space is closed to them", () => {
    expect(subjectHref("s", "space", "s", "member_removed")).toBe("#/")
  })

  it("describes every v0.2 notification without falling back", () => {
    const kinds = [
      "note",
      "note_reply",
      "idea_invite",
      "idea_invite_accepted",
      "idea_comment",
      "idea_stage_changed",
      "event_invite",
      "event_rsvp",
      "event_updated",
      "event_cancelled",
      "event_reminder",
      "member_removed",
    ]
    for (const type of kinds) expect(describeNotification(n({ type }))).not.toMatch(/did something/)
    expect(describeNotification(n({ type: "member_removed" }))).toBe(
      "You were removed from a space",
    )
    expect(describeNotification(n({ type: "event_reminder" }))).toBe("A plan is coming up")
  })

  it("labels every activity the database records", () => {
    for (const eventType of [
      "task_created",
      "milestone_completed",
      "space_customised",
      "idea_collaborator_joined",
      "event_created",
    ])
      expect(describeActivity({ eventType, actorName: "Ana" })).not.toBe(
        `Ana ${eventType.replaceAll("_", " ")}`,
      )
  })

  it("counts unread", () => {
    expect(unreadCount([n({}), n({ id: "2", readAt: "x" })])).toBe(1)
  })

  it("describes activity", () => {
    expect(describeActivity({ eventType: "member_joined", actorName: "Ben" })).toBe("Ben joined")
    expect(describeActivity({ eventType: "some_new_thing", actorName: null })).toBe(
      "Former member some new thing",
    )
  })
})
