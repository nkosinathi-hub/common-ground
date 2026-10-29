import { cleanup, render, screen } from "@testing-library/svelte"
import { House, Tv } from "@lucide/svelte"
import { afterEach, describe, expect, it } from "vitest"
import ActionRow from "./ActionRow.svelte"
import ContentsNav from "./ContentsNav.svelte"
import DetailRow from "./DetailRow.svelte"
import ListRow from "./ListRow.svelte"
import SectionHeader from "./SectionHeader.svelte"
import SettingsSection from "./SettingsSection.svelte"
import { html } from "./testing/snippet"

afterEach(cleanup)

describe("rows and sections", () => {
  it("heads a section with See all linking to the full list", () => {
    render(SectionHeader, { title: "Notes", seeAll: "#/s/1/home/notes" })
    expect(screen.getByRole("heading", { level: 2, name: "Notes" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "See all" })).toHaveAttribute(
      "href",
      "#/s/1/home/notes",
    )
  })

  it("links a whole list row, with its title, meta and detail", () => {
    render(ListRow, {
      title: "Ted Lasso",
      meta: "Series",
      detail: "Up next: S2 E4",
      icon: Tv,
      href: "#/w",
    })
    const row = screen.getByRole("link", { name: /Ted Lasso/ })
    expect(row).toHaveTextContent("Up next: S2 E4")
  })

  it("pairs a label with its value, with or without an icon", () => {
    render(DetailRow, { label: "Milestone", value: "Ready to book" })
    expect(screen.getByRole("term")).toHaveTextContent("Milestone")
    expect(screen.getByRole("definition")).toHaveTextContent("Ready to book")
    cleanup()
    render(DetailRow, { label: "Place", value: "At home", icon: House })
    expect(screen.getByRole("definition")).toHaveTextContent("At home")
  })

  it("puts an action beside what it does", () => {
    render(ActionRow, {
      title: "Remove a member",
      description: "Ben loses access immediately.",
      action: html("<button>Remove member</button>"),
    })
    expect(screen.getByText("Remove a member")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove member" })).toBeInTheDocument()
  })

  it("names a settings section by its title", () => {
    render(SettingsSection, { id: "pictures", title: "Pictures", children: html("<p>Fields</p>") })
    expect(screen.getByRole("region", { name: "Pictures" })).toHaveTextContent("Fields")
  })

  it("marks the current part in the contents", () => {
    const items = [
      { href: "#/account/privacy/store", label: "What we store" },
      { href: "#/account/privacy/rights", label: "Your rights" },
    ]
    render(ContentsNav, { items, current: "#/account/privacy/rights" })
    expect(screen.getByRole("link", { name: "Your rights" })).toHaveAttribute(
      "aria-current",
      "location",
    )
    expect(screen.getByRole("link", { name: "What we store" })).not.toHaveAttribute("aria-current")
  })
})
