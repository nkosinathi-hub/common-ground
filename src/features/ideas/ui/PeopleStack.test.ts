import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import PeopleStack from "./PeopleStack.svelte"

afterEach(cleanup)

describe("PeopleStack", () => {
  it("shows up to three initials, the rest as a count, and names everyone for screen readers", () => {
    render(PeopleStack, { props: { names: ["Ana", "ben", "Cy Lee", "Dee", "Eve"] } })
    const stack = screen.getByRole("img", { name: "On this idea: Ana, ben, Cy Lee, Dee, Eve" })
    expect(stack.textContent?.replace(/\s/g, "")).toBe("ABC+2")
  })

  it("shows nothing for an idea with nobody left on it", () => {
    render(PeopleStack, { props: { names: [] } })
    expect(screen.queryByRole("img")).toBeNull()
  })
})
