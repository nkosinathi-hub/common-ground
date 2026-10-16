import { describe, expect, it } from "vitest"
import { describeActivity, describeNotification, type Notification } from "./notification"

const shared = { eventType: "hard_talk_shared", actorName: "Ana", targetName: "Ben" }
const responded = { eventType: "hard_talk_response", actorName: "Ben", targetName: "Ana" }

describe("private activity", () => {
  it("is worded from the viewer's side and never shows what was shared", () => {
    expect(describeActivity({ ...shared, byMe: false })).toBe("Ana shared something with you")
    expect(describeActivity({ ...shared, byMe: true })).toBe("You shared something with Ben")
    expect(describeActivity({ ...responded, byMe: false })).toBe("Ben responded to what you shared")
    expect(describeActivity({ ...responded, byMe: true })).toBe("You responded to what Ana shared")
    expect(describeActivity({ ...shared, byMe: true, targetName: null })).toBe(
      "You shared something with Former member",
    )
  })
})

describe("something on my mind notifications", () => {
  const n = (type: string): Pick<Notification, "type" | "actorName"> => ({ type, actorName: "Ana" })
  it("tell who, never what", () => {
    expect(describeNotification(n("hard_talk"))).toBe("Ana shared something with you")
    expect(describeNotification(n("note_response"))).toBe("Ana responded to what you shared")
    expect(describeNotification(n("note_nudge"))).toBe(
      "A gentle reminder you asked for: a note is waiting when you're ready",
    )
  })
})
