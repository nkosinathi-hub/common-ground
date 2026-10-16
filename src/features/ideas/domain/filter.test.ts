import { describe, expect, it } from "vitest"
import { allTags, filterIdeas, groupByStage } from "./filter"
import type { Idea } from "./idea"

const idea = (
  id: string,
  title: string,
  stage: Idea["stage"],
  tags: string[],
  pitch = "",
): Idea => ({
  id,
  spaceId: "s",
  title,
  stage,
  tags,
  template: "blank",
  brief: pitch ? { pitch } : {},
  currency: "ZAR",
  createdBy: id === "1" ? "ana" : "ben",
  collaborators:
    id === "2" ? [{ userId: "ana", invitedBy: "ben", invitedAt: "", acceptedAt: "" }] : [],
  createdAt: "",
  updatedAt: "",
})
const ideas = [
  idea("1", "Tea bar", "inbox", ["food"]),
  idea("2", "Zine", "building", ["art"], "A tea-stained zine"),
  idea("3", "Pop-up", "inbox", ["food", "events"]),
]

describe("filterIdeas", () => {
  it("matches text in title or brief, case-insensitive", () => {
    expect(filterIdeas(ideas, { text: "TEA" }).map((i) => i.id)).toEqual(["1", "2"])
  })
  it("combines tag and stage", () => {
    expect(filterIdeas(ideas, { tag: "food", stage: "inbox" }).map((i) => i.id)).toEqual(["1", "3"])
    expect(filterIdeas(ideas, { tag: "events", stage: "building" })).toEqual([])
  })
  it("keeps the viewer's own ideas, or every idea they are on", () => {
    expect(filterIdeas(ideas, { whose: "mine" }, "ana").map((i) => i.id)).toEqual(["1"])
    expect(filterIdeas(ideas, { whose: "ours" }, "ana").map((i) => i.id)).toEqual(["1", "2"])
    expect(filterIdeas(ideas, { whose: "ours" })).toEqual([])
  })
})

describe("groupByStage", () => {
  it("returns a column for every stage, empty ones included", () => {
    const board = groupByStage(ideas)
    expect(board).toHaveLength(7)
    expect(board[0]?.ideas.map((i) => i.id)).toEqual(["1", "3"])
    expect(board[6]?.ideas).toEqual([])
  })
})

describe("allTags", () => {
  it("lists every tag once, sorted", () => {
    expect(allTags(ideas)).toEqual(["art", "events", "food"])
  })
})
