import { cleanup, render, screen } from "@testing-library/svelte"
import { afterEach, describe, expect, it } from "vitest"
import { Play } from "@lucide/svelte"
import FanItems from "./FanItems.svelte"

afterEach(cleanup)
describe("contextual fan destinations", () => {
  const tool = { label: "Trailer", icon: Play, onclick: () => {} }
  for (const count of [0, 1, 2, 3, 4]) {
    it(`keeps all five global routes when the page has ${count} contextual tools`, () => {
      render(FanItems, {
        spaceId: "s",
        current: "watch",
        tools: Array.from({ length: count }, () => ({ ...tool })),
        routes: true,
        onNavigate: () => {},
        onClose: () => {},
      })
      expect(screen.getAllByRole("link")).toHaveLength(5)
      expect(screen.getByRole("link", { name: "Watch" })).toHaveAttribute("aria-current", "page")
      for (const link of screen.getAllByRole("link"))
        expect(link.getAttribute("style")).not.toContain("undefined")
    })
  }
})
