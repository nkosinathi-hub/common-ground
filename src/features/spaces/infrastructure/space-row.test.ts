import { describe, expect, it } from "vitest"
import { profileColumns, toSpace } from "./space-row"
import { SPACE_ROW } from "./space-row.fixture"

describe("space rows", () => {
  it("maps a row and the caller's role to a Space, dropping unknown values", () => {
    expect(toSpace({ ...SPACE_ROW, icon: "skull" }, "member")).toEqual({
      id: "s1",
      name: "Us",
      template: "couple",
      role: "member",
      tagline: "Hi",
      description: "",
      theme: "ocean",
      accent: "#aabbcc",
      icon: null,
      avatarPath: "s1/avatar/a.webp",
      coverPath: null,
      homeCards: ["ideas", "notes"],
      defaultWatchIntent: "watch_together",
      weekStartsOn: 0,
    })
  })

  it("reads an archived default intent and odd week starts as the defaults", () => {
    const odd = { ...SPACE_ROW, default_watch_intent: "archived" as const, week_starts_on: 3 }
    expect(toSpace(odd, "owner")).toMatchObject({
      defaultWatchIntent: "want_to_watch",
      weekStartsOn: 1,
    })
  })

  it("writes only the columns a patch names", () => {
    expect(profileColumns({ accent: null, theme: "dusk", homeCards: ["notes"] })).toEqual({
      accent_color: null,
      theme: "dusk",
      home_cards: ["notes"],
    })
    expect(
      profileColumns({ name: "A", weekStartsOn: 0, defaultWatchIntent: "watch_together" }),
    ).toEqual({ name: "A", week_starts_on: 0, default_watch_intent: "watch_together" })
  })
})
