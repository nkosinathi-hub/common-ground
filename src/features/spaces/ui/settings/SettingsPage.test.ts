import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/svelte"
import { setMode } from "mode-watcher"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import type { Space } from "../../domain/space"
import { sampleSpace } from "../../testing/sample-space"
import { spacesSetup } from "../../testing/spaces-setup"
import { provideSpaces } from "../context"
import SettingsPage from "../SettingsPage.svelte"
import { SpacesStore } from "../spaces.svelte"

afterEach(cleanup)

async function open(overrides: Partial<Space> = {}) {
  const { gateway, service } = spacesSetup()
  gateway.spaces.push(sampleSpace({ id: "s1", name: "Us", ...overrides }))
  const store = new SpacesStore(service)
  await store.refresh()
  const provide = () => provideSpaces({ service, store })
  const space = store.spaces[0]!
  render(Provided, { props: { provide, component: SettingsPage, props: { space, me: "u1" } } })
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

  it("saves a preset and a custom accent, and notes when it was adjusted", async () => {
    setMode("light")
    const { gateway } = await open()
    await fireEvent.click(screen.getByRole("radio", { name: "Ocean" }))
    await fireEvent.input(screen.getByLabelText("Accent hex code"), {
      target: { value: "#FFFF00" },
    })
    expect(screen.getByText(/Adjusted for readability/)).toBeInTheDocument()
    expect(screen.getByTestId("look-preview").style.getPropertyValue("--primary")).not.toBe("")
    await fireEvent.click(screen.getByRole("button", { name: "Save look" }))
    await waitFor(() =>
      expect(gateway.spaces[0]).toMatchObject({ theme: "ocean", accent: "#ffff00" }),
    )
    await fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    expect(screen.getByText(/No custom accent/)).toBeInTheDocument()
  })

  it("hides and reorders Home cards", async () => {
    const { gateway } = await open()
    await fireEvent.click(screen.getByRole("switch", { name: "Show Notes for you" }))
    await fireEvent.click(screen.getByRole("button", { name: "Move Recent activity up" }))
    await fireEvent.click(screen.getByRole("button", { name: "Save layout" }))
    await waitFor(() =>
      expect(gateway.spaces[0]?.homeCards).toEqual([
        "continue_watching",
        "coming_up",
        "activity",
        "recommended",
      ]),
    )
  })

  it("saves the default watch intent and week start", async () => {
    const { gateway } = await open()
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

  it("jumps to a section from the section nav", async () => {
    await open()
    const nav = screen.getByRole("navigation", { name: "Settings sections" })
    Element.prototype.scrollIntoView = () => {}
    await fireEvent.click(within(nav).getByRole("button", { name: "Home layout" }))
    expect(document.activeElement?.id).toBe("settings-home")
  })
})

describe("SettingsPage for a member", () => {
  it("shows only appearance, members and leaving", async () => {
    await open({ role: "member" })
    expect(screen.queryByText("Name and feel")).toBeNull()
    expect(screen.queryByRole("button", { name: "Save look" })).toBeNull()
    expect(screen.getByRole("radiogroup", { name: "Appearance" })).toBeInTheDocument()
  })
})
