import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { ok } from "@/shared/domain"
import Provided from "@/shared/ui/testing/Provided.svelte"
import type { WatchService } from "../application/watch-service"
import { item } from "../testing/fixtures"
import { provideWatch } from "./context"
import SessionsPanel from "./SessionsPanel.svelte"

function renderWith(together: { season: number | null; episode: number | null } | null) {
  const service = { sessions: async () => ok([]) }
  const provide = () =>
    provideWatch({
      service: service as unknown as WatchService,
      members: { members: async () => ok([]) },
      authors: { authors: async () => ok([]) },
    })
  const props = {
    item: item(1, "Show", { mediaType: "series" }),
    together,
    members: [],
    authors: [],
    onLogged: () => {},
  }
  render(Provided, { props: { provide, component: SessionsPanel, props } })
}

afterEach(cleanup)

describe("SessionsPanel together", () => {
  it("shows where you are together, which only a watch party moves", async () => {
    renderWith({ season: 1, episode: 2 })
    const badge = await screen.findByText("S1 E2", { exact: false })
    expect(badge).toHaveTextContent("Together at S1 E2")
  })

  it("says nothing about together before any party", async () => {
    renderWith(null)
    await screen.findByRole("button", { name: "Log watched together" })
    expect(screen.queryByText(/Together at/)).toBeNull()
  })
})
