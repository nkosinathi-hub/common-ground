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
    expect(describeNotification(n({ type: "weird" }))).toBe("Ana did something")
  })

  it("links subjects to their screens", () => {
    expect(subjectHref("s", "watch_item", "w")).toBe("#/s/s/watch/w")
    expect(subjectHref("s", "idea", "i")).toBe("#/s/s/ideas/i/overview")
    expect(subjectHref("s", "task", "t")).toBe("#/s/s/ideas")
    expect(subjectHref("s", "space", "s")).toBe("#/s/s/settings")
    expect(subjectHref("s", "comment", "c")).toBe("#/s/s/home")
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
