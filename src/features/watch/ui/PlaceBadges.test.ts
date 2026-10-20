import { render, screen } from "@testing-library/svelte"
import { describe, expect, it } from "vitest"
import { item } from "../testing/fixtures"
import PlaceBadges from "./PlaceBadges.svelte"

const names = [
  { id: "a", displayName: "Ana" },
  { id: "b", displayName: "Ben" },
]

describe("PlaceBadges", () => {
  it("shows each person's episode, the together chip, and who is ahead", () => {
    const show = item(1, "Show", {
      mediaType: "series",
      places: [
        { userId: "a", status: "watching", season: 1, episode: 4 },
        { userId: "b", status: "watching", season: 1, episode: 2 },
      ],
      together: { season: 1, episode: 2 },
    })
    render(PlaceBadges, { props: { item: show, names } })
    expect(screen.getByText("Together S1E2")).toBeInTheDocument()
    expect(screen.getByLabelText("Ana is at S1E4, ahead of together")).toBeInTheDocument()
    expect(screen.getByLabelText("Ben is at S1E2")).toBeInTheDocument()
  })

  it("shows nothing for a title nobody has started", () => {
    const { container } = render(PlaceBadges, { props: { item: item(2, "New"), names } })
    expect(container.textContent?.trim()).toBe("")
  })
})
