import { cleanup, fireEvent, render, screen } from "@testing-library/svelte"
import { tick } from "svelte"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CatalogService } from "../application/catalog-service"
import { FakeCatalogGateway } from "../testing/fake-catalog-gateway"
import { SPACE_ID, title } from "../testing/fixtures"
import Provided from "@/shared/ui/testing/Provided.svelte"
import CatalogSearch from "./CatalogSearch.svelte"
import { provideCatalog } from "./context"

const OUTAGE_MESSAGE = "The catalog is unavailable right now. Your search is kept."
const settle = async (ms = 0) => {
  await vi.advanceTimersByTimeAsync(ms)
  await tick()
}

function setup() {
  const gateway = new FakeCatalogGateway()
  gateway.titles = [title(1, "Dune"), title(2, "Dune: Part Two"), title(3, "Arrival")]
  const onPick = vi.fn()
  const onManual = vi.fn()
  const provide = () => provideCatalog({ service: new CatalogService(gateway) })
  const props = { spaceId: SPACE_ID, onPick, onManual }
  render(Provided, { props: { provide, component: CatalogSearch, props } })
  const input = screen.getByRole<HTMLInputElement>("searchbox")
  const type = (value: string) => fireEvent.input(input, { target: { value } })
  return { gateway, onPick, onManual, input, type }
}

describe("CatalogSearch", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }))
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("debounces typing by 300 ms and sends one request", async () => {
    const { gateway, type } = setup()
    await type("du")
    await type("dun")
    await type("dune")
    await settle(299)
    expect(gateway.calls).toHaveLength(0)
    await settle(1)
    expect(gateway.calls.map((c) => c.request)).toEqual([
      { spaceId: SPACE_ID, query: "dune", page: 1 },
    ])
    expect(screen.getByText("Dune: Part Two")).toBeInTheDocument()
  })

  it("cancels a stale request so its results never show", async () => {
    const { gateway, type } = setup()
    gateway.hold = true
    await type("dune")
    await settle(300)
    await type("arrival")
    await settle(300)
    gateway.release()
    await settle()
    expect(gateway.aborted.map((c) => (c.request as { query: string }).query)).toEqual(["dune"])
    expect(screen.getByText("Arrival")).toBeInTheDocument()
    expect(screen.queryByText("Dune")).not.toBeInTheDocument()
  })

  it("pages through results", async () => {
    const { gateway, type } = setup()
    gateway.pageSize = 1
    await type("dune")
    await settle(300)
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument()
    await fireEvent.click(screen.getByRole("button", { name: "Next results" }))
    await settle()
    expect(gateway.calls.at(-1)?.request).toMatchObject({ page: 2 })
    expect(screen.getByText("Dune: Part Two")).toBeInTheDocument()
  })

  it("shows the outage message, keeps the query and retries", async () => {
    const { gateway, input, type } = setup()
    gateway.failWith = { kind: "network", message: OUTAGE_MESSAGE }
    await type("dune")
    await settle(300)
    expect(screen.getByRole("alert")).toHaveTextContent(OUTAGE_MESSAGE)
    expect(input.value).toBe("dune")
    gateway.failWith = null
    await fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    await settle()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.getByText("Dune")).toBeInTheDocument()
  })

  it("hands picked titles and manual adds to the caller", async () => {
    const { onPick, onManual, type } = setup()
    await type("arrival")
    await settle(300)
    await fireEvent.click(screen.getByRole("button", { name: "Add Arrival" }))
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 3, title: "Arrival" }))
    await fireEvent.click(screen.getByRole("button", { name: /add a title manually instead/i }))
    expect(onManual).toHaveBeenCalledOnce()
  })
})
