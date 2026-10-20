import { describe, expect, it } from "vitest"
import type { CatalogTitle } from "@/features/catalog"
import { appError } from "@/shared/domain"
import { WatchService } from "../application/watch-service"
import { FakeWatchGateway } from "../testing/fake-watch-gateway"
import { SPACE_ID } from "../testing/fixtures"
import { AddTitleState } from "./add-title-state.svelte"

const title = (id: number, name: string): CatalogTitle => ({
  ...{ id, type: "movie", title: name, year: 2021, mediaKind: "movie" },
  ...{ posterPath: null, synopsis: "" },
})
const dune = title(1, "Dune")

function setup() {
  const gateway = new FakeWatchGateway()
  const adds = new AddTitleState(
    new WatchService(gateway),
    () => SPACE_ID,
    () => "want_to_watch",
  )
  return { gateway, adds }
}

describe("AddTitleState", () => {
  it("marks a result adding, then added, and records it once", async () => {
    const { gateway, adds } = setup()
    const pending = adds.pick(dune)
    expect(adds.statusOf(dune)).toBe("adding")
    expect(await adds.pick(title(2, "Arrival"))).toBeNull()
    expect((await pending)?.ok).toBe(true)
    expect(adds.statusOf(dune)).toBe("added")
    expect(adds.statusOf(title(2, "Arrival"))).toBe("idle")
    expect(await adds.pick(dune)).toBeNull()
    expect(gateway.items.map((i) => i.title)).toEqual(["Dune"])
    expect(adds.added.map((a) => a.title)).toEqual(["Dune"])
  })

  it("keys by type and id, so a show sharing a movie's TMDB id stays addable", async () => {
    const { adds } = setup()
    await adds.pick(dune)
    expect(adds.statusOf({ ...dune, type: "tv" })).toBe("idle")
  })

  it("shows a title already on the list as added, without counting it as new", async () => {
    const { gateway, adds } = setup()
    gateway.failWith = appError("conflict", "Already on your list")
    expect(await adds.pick(dune)).toMatchObject({ ok: false, error: { kind: "conflict" } })
    expect(adds.statusOf(dune)).toBe("added")
    expect(adds.added).toEqual([])
  })

  it("puts a failed add back to idle so it can be tried again", async () => {
    const { gateway, adds } = setup()
    gateway.failWith = appError("network", "down")
    expect((await adds.pick(dune))?.ok).toBe(false)
    expect(adds.statusOf(dune)).toBe("idle")
    gateway.failWith = null
    expect((await adds.pick(dune))?.ok).toBe(true)
  })

  it("records manual adds with the trimmed title, and forgets everything on reset", async () => {
    const { adds } = setup()
    await adds.pick(dune)
    await adds.addManual({
      ...{ title: "  Home video ", mediaType: "movie", releaseYear: null },
      ...{ synopsis: "", availabilityNote: null },
    })
    expect(adds.added.map((a) => a.title)).toEqual(["Dune", "Home video"])
    adds.reset()
    expect(adds.added).toEqual([])
    expect(adds.statusOf(dune)).toBe("idle")
  })
})
