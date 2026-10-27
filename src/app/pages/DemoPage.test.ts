import { fireEvent, render, screen, within } from "@testing-library/svelte"
import { describe, expect, it } from "vitest"
import DemoPage from "./DemoPage.svelte"

describe("public sample demo", () => {
  it("lets a signed-out visitor browse titles, episodes and a player dialog", async () => {
    render(DemoPage)
    const navigation = within(screen.getAllByRole("navigation", { name: /Demo sections/ })[0]!)
    await fireEvent.click(navigation.getByRole("button", { name: "Watchlist" }))
    expect(screen.getByRole("heading", { name: "Our watchlist" })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: /Arrival/ }))
    expect(screen.getByRole("heading", { name: "Arrival" })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "Play movie" }))
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText(/isn't connected in this visual demo/)).toBeInTheDocument()
  })

  it("shows idea stages and read-only invitation dialogs", async () => {
    render(DemoPage)
    const navigation = within(screen.getAllByRole("navigation", { name: /Demo sections/ })[0]!)
    await fireEvent.click(navigation.getByRole("button", { name: "Ideas" }))
    expect(screen.getByRole("heading", { name: "Things we could do" })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "New idea" }))
    expect(screen.getByRole("dialog")).toHaveTextContent("Nothing here will be sent or saved")
  })
})
