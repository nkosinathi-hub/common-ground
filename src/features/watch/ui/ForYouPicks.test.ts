import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import Provided from "@/shared/ui/testing/Provided.svelte"
import { SPACE_ID, item } from "../testing/fixtures"
import { watchFakes } from "../testing/render-context"
import { provideWatch } from "./context"
import ForYouPicks from "./ForYouPicks.svelte"

afterEach(cleanup)

describe("ForYouPicks", () => {
  it("offers up to three titles you have not started, never one you disliked", async () => {
    const fakes = watchFakes()
    const titles = ["Arrival", "Severance", "Shōgun", "Chernobyl", "The Bear"].map((t, i) =>
      item(i + 1, t),
    )
    fakes.gateway.items = titles
    fakes.opinionRows.titles = titles.map((t) => ({
      id: t.id,
      genres: ["drama"],
      streamable: false,
    }))
    fakes.opinionRows.rows.set(titles[1]!.id, "disliked")
    const props = { spaceId: SPACE_ID, itemHref: (id: string) => `#/${id}` }
    render(Provided, {
      props: { provide: () => provideWatch(fakes.context), component: ForYouPicks, props },
    })
    const links = await screen.findAllByRole("link")
    expect(links).toHaveLength(3)
    expect(screen.queryByText("Severance")).toBeNull()
  })
})
