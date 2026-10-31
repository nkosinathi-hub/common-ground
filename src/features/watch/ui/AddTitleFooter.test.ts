import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import AddTitleFooter from "./AddTitleFooter.svelte"

afterEach(cleanup)

const noop = () => {}

describe("AddTitleFooter", () => {
  it("offers only Done while searching; the data sources are credited under Account", () => {
    render(AddTitleFooter, { mode: "search", canAdd: false, ondone: noop, oncancel: noop })
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
    expect(screen.queryByText(/TMDB/)).toBeNull()
  })
})
