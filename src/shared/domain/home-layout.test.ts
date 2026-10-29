import { describe, expect, it } from "vitest"
import {
  DEFAULT_HOME_CARDS,
  HOME_CARDS,
  HOME_CARD_COLUMN,
  HOME_CARD_LABELS,
  moveCard,
  toggleCard,
  visibleCards,
} from "./home-layout"

describe("home layout", () => {
  it("matches the cards the database accepts, with a label for each", () => {
    expect(HOME_CARDS).toEqual([
      "notes",
      "on_your_mind",
      "continue_watching",
      "coming_up",
      "calendar",
      "recommended",
      "activity",
      "ideas",
    ])
    for (const id of HOME_CARDS) {
      expect(HOME_CARD_LABELS[id]).toBeTruthy()
      expect(["main", "aside"]).toContain(HOME_CARD_COLUMN[id])
    }
    expect(DEFAULT_HOME_CARDS).toEqual([
      "notes",
      "on_your_mind",
      "calendar",
      "continue_watching",
      "coming_up",
      "recommended",
      "activity",
    ])
  })

  it("shows the owner's order, keeps only cards this build can render, and drops repeats", () => {
    const available = new Set(["coming_up", "activity", "notes"] as const)
    expect(visibleCards(["activity", "mystery", "coming_up", "activity"], available)).toEqual([
      "activity",
      "coming_up",
    ])
    expect(visibleCards(undefined, available)).toEqual(["notes", "coming_up", "activity"])
  })

  it("moves a card up or down without falling off either end", () => {
    const cards = ["notes", "coming_up", "activity"] as const
    expect(moveCard(cards, "coming_up", -1)).toEqual(["coming_up", "notes", "activity"])
    expect(moveCard(cards, "coming_up", 1)).toEqual(["notes", "activity", "coming_up"])
    expect(moveCard(cards, "notes", -1)).toEqual(cards)
    expect(moveCard(cards, "activity", 1)).toEqual(cards)
  })

  it("hides a shown card and appends a hidden one at the end", () => {
    expect(toggleCard(["notes", "activity"], "notes")).toEqual(["activity"])
    expect(toggleCard(["notes"], "calendar")).toEqual(["notes", "calendar"])
  })
})
