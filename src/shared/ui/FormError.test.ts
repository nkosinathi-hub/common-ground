import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import FormError from "./FormError.svelte"

afterEach(cleanup)

describe("FormError", () => {
  it("announces a form error", () => {
    render(FormError, { props: { message: "Could not save" } })
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save")
  })

  it("shows a field error by id without announcing it", () => {
    const { container } = render(FormError, {
      props: { message: "Too long", id: "note-error", alert: false },
    })
    expect(screen.queryByRole("alert")).toBeNull()
    expect(container.querySelector("#note-error")).toHaveTextContent("Too long")
  })

  it("renders nothing without a message", () => {
    const { container } = render(FormError, { props: { message: null } })
    expect(container.querySelector("p")).toBeNull()
  })
})
