import { describe, expect, it } from "vitest"
import { pageTitle } from "./page-title.svelte"

describe("pageTitle", () => {
  it("names the open page until it closes, without clearing a newer page's name", () => {
    const closeFirst = pageTitle.show("Ted Lasso")
    expect(pageTitle.current).toBe("Ted Lasso")
    const closeSecond = pageTitle.show("Dune")
    closeFirst()
    expect(pageTitle.current).toBe("Dune")
    closeSecond()
    expect(pageTitle.current).toBe("")
  })
})
