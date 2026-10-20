import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { sampleSpace } from "../testing/sample-space"
import { spacesSetup } from "../testing/spaces-setup"
import { provideSpaces } from "./context"
import SpaceAvatar from "./SpaceAvatar.svelte"
import SpaceBanner from "./SpaceBanner.svelte"
import { SpacesStore } from "./spaces-store.svelte"

afterEach(cleanup)

// SpaceBanner and SpaceAvatar take the same props, so one component type covers both.
async function show(component: typeof SpaceBanner, extra = {}) {
  const { gateway, service } = spacesSetup()
  const space = sampleSpace({ id: "s1", name: "hearth", template: "family", ...extra })
  gateway.spaces.push(space)
  const store = new SpacesStore(service)
  await store.refresh()
  const provide = () => provideSpaces({ service, store })
  return render(Provided, { props: { provide, component, props: { space, title: "Hello, Ana" } } })
}

describe("SpaceBanner", () => {
  it("shows the tagline under the title, or the template welcome without one", async () => {
    await show(SpaceBanner, { tagline: "Sunday dinners" })
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello, Ana")
    expect(screen.getByText("Sunday dinners")).toBeInTheDocument()
    cleanup()
    await show(SpaceBanner)
    expect(screen.getByText(/A place for everyone/)).toBeInTheDocument()
  })

  it("puts the signed cover behind the text", async () => {
    await show(SpaceBanner, { coverPath: "s1/cover/c.webp" })
    expect(screen.getByTestId("space-banner").style.backgroundImage).toContain("s1/cover/c.webp")
  })
})

describe("SpaceAvatar", () => {
  it("prefers the picture, then the icon, then the initial", async () => {
    await show(SpaceAvatar, { avatarPath: "s1/avatar/a.webp" })
    expect(screen.getByTestId("space-avatar").querySelector("img")?.src).toContain("a.webp")
    cleanup()
    await show(SpaceAvatar, { icon: "heart" })
    expect(screen.getByTestId("space-avatar").querySelector("svg")).not.toBeNull()
    cleanup()
    await show(SpaceAvatar)
    expect(screen.getByTestId("space-avatar")).toHaveTextContent("H")
  })
})
