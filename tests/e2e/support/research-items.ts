import { byTestId, type ItemKind } from "./item-kind"

/** Notes, links and hypotheses on the research tab. */
export const RESEARCH_KINDS: readonly ItemKind[] = [
  {
    name: "note",
    tab: "research",
    add: async (page, text) => {
      await page.getByLabel("New note").fill(text)
      await page.getByRole("button", { name: "Add note" }).click()
    },
    row: byTestId("note"),
    deleteLabel: () => "Delete note",
  },
  {
    name: "link",
    tab: "research",
    add: async (page, text) => {
      await page.getByLabel("Link URL").fill(`https://example.com/${text.replaceAll(" ", "-")}`)
      await page.getByLabel("Link title").fill(text)
      await page.getByRole("button", { name: "Add link" }).click()
    },
    row: byTestId("research-link"),
    deleteLabel: (text) => `Delete link ${text}`,
  },
  {
    name: "hypothesis",
    tab: "research",
    add: async (page, text) => {
      await page.getByLabel("New hypothesis").fill(text)
      await page.getByRole("button", { name: "Add", exact: true }).click()
    },
    row: byTestId("hypothesis"),
    deleteLabel: () => "Delete hypothesis",
  },
]
