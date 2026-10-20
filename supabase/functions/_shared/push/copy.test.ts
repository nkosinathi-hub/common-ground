import { describe, expect, it } from "vitest"
// The SPA's own copy and routes: push must say and open exactly what the bell does.
import { MESSAGES } from "../../../../src/features/notifications/domain/messages.ts"
import {
  describeNotification,
  subjectHref,
} from "../../../../src/features/notifications/domain/notification.ts"
import { PUSH_BODIES, pushCopy, pushRoute } from "./copy.ts"

const SPACE = "0b9c2f6e-6a43-4c8e-9f0a-3d2b1c4e5f60"
const SUBJECT = "1c9d2f6e-6a43-4c8e-9f0a-3d2b1c4e5f61"
const SUBJECTS = [
  "watch_item",
  "idea",
  "task",
  "calendar_event",
  "profile",
  "space",
  "comment",
  "watch_party",
]

describe("pushCopy", () => {
  it("knows every kind the bell knows", () => {
    expect(Object.keys(PUSH_BODIES).sort()).toEqual(Object.keys(MESSAGES).sort())
  })

  it.each(Object.keys(MESSAGES))("words %s exactly like the bell", (type) => {
    expect(pushCopy(type, "Ana").body).toBe(describeNotification({ type, actorName: "Ana" }))
    expect(pushCopy(type, null).body).toBe(describeNotification({ type, actorName: null }))
  })

  it("titles by area and falls back for an unknown kind", () => {
    expect(pushCopy("event_reminder", null).title).toBe("Plans")
    expect(pushCopy("hard_talk", "Ana").title).toBe("Notes")
    expect(pushCopy("watch_party", "Ben")).toEqual({
      title: "Watch",
      body: "Ben started a watch party",
    })
    expect(pushCopy("brand_new_kind", "Ana")).toEqual({
      title: "Common Ground",
      body: describeNotification({ type: "brand_new_kind", actorName: "Ana" }),
    })
  })
})

describe("pushRoute", () => {
  const types = [...Object.keys(MESSAGES), undefined]
  it.each(SUBJECTS)("opens a %s where the bell opens it", (subject) => {
    for (const type of types)
      expect(pushRoute(SPACE, subject, SUBJECT, type)).toBe(
        subjectHref(SPACE, subject, SUBJECT, type),
      )
  })
})
