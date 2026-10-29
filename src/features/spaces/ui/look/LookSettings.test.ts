import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { setMode } from "mode-watcher"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { sampleSpace } from "../../testing/sample-space"
import { spacesSetup } from "../../testing/spaces-setup"
import { provideSpaces } from "../context"
import { SpacesStore } from "../spaces-store.svelte"
import LookSettings from "./LookSettings.svelte"

afterEach(cleanup)

async function open() {
  const { gateway, service } = spacesSetup()
  gateway.spaces.push(sampleSpace({ id: "s1", name: "Us" }))
  const store = new SpacesStore(service)
  await store.refresh()
  const provide = () => provideSpaces({ service, store })
  render(Provided, {
    props: { provide, component: LookSettings, props: { space: store.spaces[0]! } },
  })
  return { gateway }
}

describe("LookSettings", () => {
  it("changes the look in the preview, then saves only what differs", async () => {
    setMode("light")
    const { gateway } = await open()
    await fireEvent.click(screen.getByRole("radio", { name: "Teal" }))
    await fireEvent.click(screen.getByRole("radio", { name: /Gradient/ }))
    const preview = screen.getByTestId("look-preview")
    expect(preview.style.getPropertyValue("--primary")).toBe("#1e6b66")
    await fireEvent.click(screen.getByRole("tab", { name: "Layout and type" }))
    await fireEvent.click(screen.getByRole("radio", { name: /Rounded/ }))
    expect(preview.dataset.radius).toBe("rounded")
    await fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    await waitFor(() =>
      expect(gateway.patches.at(-1)).toEqual({
        look: { button: "#1e6b66", backgroundStyle: "gradient", corners: "rounded" },
      }),
    )
    await fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }))
    expect(preview.style.getPropertyValue("--primary")).toBe("")
  })
})
