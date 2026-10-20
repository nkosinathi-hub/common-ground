import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { ok } from "@/shared/domain"
import Provided from "@/shared/ui/testing/Provided.svelte"
import type { WatchService } from "../application/watch-service"
import { item } from "../testing/fixtures"
import { provideWatch } from "./context"
import ProgressPanel from "./ProgressPanel.svelte"

function renderWith(together: { season: number | null; episode: number | null } | null) {
  const service = { progress: async () => ok({ me: "a", entries: [], together }) }
  const provide = () =>
    provideWatch({
      service: service as unknown as WatchService,
      members: { members: async () => ok([]) },
      authors: { authors: async () => ok([]) },
    })
  const props = {
    item: item(1, "Show", { mediaType: "series" }),
    authors: [],
    version: 0,
    onSaved: () => {},
  }
  render(Provided, { props: { provide, component: ProgressPanel, props } })
}

afterEach(cleanup)

describe("ProgressPanel together", () => {
  it("shows where you are together, which only a watch party moves", async () => {
    renderWith({ season: 1, episode: 2 })
    expect(await screen.findByText(/Together: S1E2/)).toBeInTheDocument()
  })

  it("says nothing about together before any party", async () => {
    renderWith(null)
    await screen.findByText("Everyone's progress")
    expect(screen.queryByText(/Together:/)).toBeNull()
  })
})
