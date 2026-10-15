import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { appError, err } from "@/shared/domain"
import Provided from "../testing/Provided.svelte"
import { spacesSetup } from "../testing/spaces-setup"
import { provideSpaces } from "./context"
import NewSpacePage from "./NewSpacePage.svelte"
import { SpacesStore } from "./spaces.svelte"

afterEach(cleanup)

describe("NewSpacePage", () => {
  it("shows why memberships failed to load and retries", async () => {
    const { gateway, service } = spacesSetup()
    const listMine = gateway.listMine.bind(gateway)
    gateway.listMine = async () => err(appError("network", "Could not reach the server"))
    const store = new SpacesStore(service)
    await store.refresh()
    const provide = () => provideSpaces({ service, store })
    render(Provided, { props: { provide, component: NewSpacePage } })
    expect(screen.getByRole("alert")).toHaveTextContent("Could not reach the server")
    gateway.listMine = listMine
    await fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull())
    expect(store.status).toBe("ready")
  })

  it("shows no error while memberships are fine", async () => {
    const { service } = spacesSetup()
    const store = new SpacesStore(service)
    await store.refresh()
    render(Provided, {
      props: { provide: () => provideSpaces({ service, store }), component: NewSpacePage },
    })
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.getByRole("button", { name: "Create space" })).toBeInTheDocument()
  })
})
