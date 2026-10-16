import { describe, expect, it } from "vitest"
import { RESPONSES, supportLine, wishLine } from "./hard-talk-copy"
import { authorStatus, hardTalkTitle, isWaitingFor } from "./hard-talk-status"
import type { Note } from "./note"

const note = (extra: Partial<Note> = {}) =>
  ({
    id: "n",
    authorId: "ana",
    authorName: "Ana",
    recipient: { kind: "member", id: "ben", name: "Ben" },
    kind: "hard_talk",
    readAt: null,
    lastReplyAt: null,
    latestResponse: null,
    ...extra,
  }) as Note

describe("hardTalkTitle", () => {
  it("reads from the viewer's side, never with the content", () => {
    expect(hardTalkTitle(note(), "ben")).toBe("Ana shared something with you")
    expect(hardTalkTitle(note(), "ana")).toBe("You shared something with Ben")
  })
})

describe("authorStatus", () => {
  it("is calm until they respond, then shows the latest response", () => {
    expect(authorStatus(note())).toBe("No rush. Ben hasn't responded yet")
    const later = note({ latestResponse: { kind: "time", at: "2026-10-16T10:00:00Z" } })
    expect(authorStatus(later)).toBe("Ben: I need a little time. I'll come back to this")
  })
})

describe("isWaitingFor", () => {
  it("is a hard_talk note to the viewer they have not opened", () => {
    expect(isWaitingFor(note(), "ben")).toBe(true)
    expect(isWaitingFor(note(), "ana")).toBe(false)
    expect(isWaitingFor(note({ readAt: "2026-10-16T10:00:00Z" }), "ben")).toBe(false)
    expect(isWaitingFor(note({ kind: "note" }), "ben")).toBe(false)
  })
})

describe("wish lines", () => {
  it("say what the writer hopes for, and nothing for whatever feels right", () => {
    expect(wishLine("talk", "Ana")).toBe(
      "Ana would like to talk about this in person, when you're both ready.",
    )
    expect(wishLine("write", "Ana")).toBe("Ana would like you to write back when you're ready.")
    expect(wishLine("read", "Ana")).toBe("Ana just needs you to read it. No reply needed.")
    expect(wishLine("any", "Ana")).toBeNull()
    expect(supportLine("listen", "Ana")).toBe("Right now Ana mostly wants to be heard.")
    expect(supportLine("solve", "Ana")).toBe("Ana would like to work it out together.")
    expect(RESPONSES.map((r) => r.value)).toEqual(["here", "time", "talk", "thanks"])
  })
})
