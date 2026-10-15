import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import EmptyState from "./EmptyState.svelte"

afterEach(cleanup)

describe("EmptyState heading level", () => {
  it("is a section heading by default", () => {
    render(EmptyState, { props: { title: "Nothing yet" } })
    expect(screen.getByRole("heading", { level: 2, name: "Nothing yet" })).toBeInTheDocument()
  })

  it("is the page heading when the empty state is the whole page", () => {
    render(EmptyState, { props: { title: "Not available", level: 1 } })
    expect(screen.getByRole("heading", { level: 1, name: "Not available" })).toBeInTheDocument()
  })
})
