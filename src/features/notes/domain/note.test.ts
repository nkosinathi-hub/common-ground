import { describe, expect, it } from "vitest"
import { isUnread, NOTE_MAX, sortForHome, validateNote, type Note } from "./note"

const note = (id: string, extra: Partial<Note> = {}): Note => ({
  id,
  spaceId: "s",
  authorId: "ana",
  authorName: "Ana",
  recipient: { kind: "everyone" },
  body: id,
  pinned: false,
  expiresAt: null,
  replyCount: 0,
  lastReplyAt: null,
  readAt: "2026-10-16T09:00:00Z",
  createdAt: `2026-10-16T0${id}:00:00Z`,
  ...extra,
})

describe("validateNote", () => {
  it("trims and accepts 1 to 1000 characters", () => {
    expect(validateNote("  Hi Ben  ")).toEqual({ ok: true, value: "Hi Ben" })
    expect(validateNote("x".repeat(NOTE_MAX)).ok).toBe(true)
  })

  it("refuses an empty or overlong note, on the body field", () => {
    for (const body of ["   ", "x".repeat(NOTE_MAX + 1)]) {
      expect(validateNote(body)).toMatchObject({
        ok: false,
        error: { kind: "validation", field: "body", message: "Notes are 1 to 1000 characters" },
      })
    }
  })
})

describe("isUnread", () => {
  it("is unread until opened, and again after a newer reply", () => {
    expect(isUnread(note("1", { readAt: null }))).toBe(true)
    expect(isUnread(note("1"))).toBe(false)
    expect(isUnread(note("1", { lastReplyAt: "2026-10-16T10:00:00Z" }))).toBe(true)
    expect(isUnread(note("1", { lastReplyAt: "2026-10-16T08:00:00Z" }))).toBe(false)
    const read = { readAt: "2026-10-16T09:00:00.300Z" }
    expect(isUnread({ ...read, lastReplyAt: "2026-10-16T09:00:00.285734+00:00" })).toBe(false)
    expect(isUnread({ ...read, lastReplyAt: "2026-10-16T11:00:00+02:00" })).toBe(false)
  })
})

describe("sortForHome", () => {
  it("puts pinned notes first, then unread ones, then the newest", () => {
    const notes = [
      note("1"),
      note("2", { readAt: null }),
      note("3"),
      note("4", { pinned: true }),
      note("5", { readAt: null }),
    ]
    expect(sortForHome(notes).map((n) => n.id)).toEqual(["4", "5", "2", "3", "1"])
  })
})
