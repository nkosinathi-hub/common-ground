import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import type { SettingsTab } from "@/shared/domain"
import type { Space } from "../../domain/space"
import { sampleSpace } from "../../testing/sample-space"
import { spacesSetup } from "../../testing/spaces-setup"
import { provideSpaces } from "../context"
import SettingsPage from "../SettingsPage.svelte"
import { SpacesStore } from "../spaces-store.svelte"

afterEach(cleanup)

async function open(overrides: Partial<Space> = {}, tab?: SettingsTab) {
  const { gateway, service } = spacesSetup()
  gateway.spaces.push(sampleSpace({ id: "s1", name: "Us", ...overrides }))
  const store = new SpacesStore(service)
  await store.refresh()
  const provide = () => provideSpaces({ service, store })
  const space = store.spaces[0]!
  render(Provided, { props: { provide, component: SettingsPage, props: { space, me: "u1", tab } } })
  return { gateway, store }
}

const card = (title: string) =>
  screen.getByText(title, { selector: "[data-slot=card-title]" }).closest("[data-slot=card]")!

describe("SettingsPage for the owner", () => {
  it("saves the name, tagline and icon together", async () => {
    const { gateway } = await open()
    await fireEvent.input(screen.getByLabelText("Tagline"), { target: { value: " Our corner " } })
    await fireEvent.click(screen.getByRole("radio", { name: "heart" }))
    await fireEvent.click(within(card("Name and feel") as HTMLElement).getByText("Save"))
    await waitFor(() => expect(gateway.spaces[0]).toMatchObject({ tagline: "Our corner" }))
    expect(gateway.spaces[0]?.icon).toBe("heart")
  })

  it("hides and reorders Home cards", async () => {
    const { gateway } = await open({}, "home")
    await fireEvent.click(screen.getByRole("switch", { name: "Show Notes for you" }))
    await fireEvent.click(screen.getByRole("button", { name: "Move Recent activity up" }))
    await fireEvent.click(screen.getByRole("button", { name: "Save layout" }))
    await waitFor(() =>
      expect(gateway.spaces[0]?.homeCards).toEqual([
        "calendar",
        "continue_watching",
        "coming_up",
        "activity",
        "recommended",
      ]),
    )
  })

  it("saves the default watch intent and week start", async () => {
    const { gateway } = await open({}, "home")
    await fireEvent.click(screen.getByLabelText("Watch together"))
    await fireEvent.click(screen.getByLabelText("Sunday"))
    await fireEvent.click(screen.getByRole("button", { name: "Save preferences" }))
    await waitFor(() =>
      expect(gateway.spaces[0]).toMatchObject({
        defaultWatchIntent: "watch_together",
        weekStartsOn: 0,
      }),
    )
  })

  it("opens the tab in the link, with all four tabs for the owner", async () => {
    await open({}, "members")
    const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent?.trim())
    expect(tabs).toEqual(["Identity", "Look and feel", "Home & preferences", "Members & safety"])
    expect(screen.getByRole("tab", { name: "Members & safety" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  })
})

describe("SettingsPage for a member", () => {
  it("shows only appearance, members and leaving", async () => {
    await open({ role: "member" }, "identity")
    expect(screen.getAllByRole("tab")).toHaveLength(2)
    expect(screen.queryByText("Name and feel")).toBeNull()
    expect(screen.queryByRole("button", { name: "Save look" })).toBeNull()
    expect(screen.getByRole("radiogroup", { name: "Appearance" })).toBeInTheDocument()
  })
})
