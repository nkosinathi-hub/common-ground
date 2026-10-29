import type { Locator, Page } from "@playwright/test"

export interface ItemKind {
  readonly name: string
  readonly tab: "research" | "tasks" | "milestones"
  add(page: Page, text: string): Promise<void>
  row(page: Page, text: string): Locator
  deleteLabel(text: string): string
  /** Runs after every visit to the tab, e.g. to expand a collapsed list. */
  reveal?(page: Page): Promise<void>
  /** Opens the row where its delete lives, e.g. a milestone's editor. */
  openForDelete?(page: Page, text: string): Promise<void>
  /** A delete in a menu is a menuitem; elsewhere a button. */
  readonly deleteRole?: "button" | "menuitem"
}

export const byTestId = (id: string) => (page: Page, text: string) =>
  page.getByTestId(id).filter({ hasText: text })
