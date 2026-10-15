import type { Locator, Page } from "@playwright/test"

export interface ItemKind {
  readonly name: string
  readonly tab: "research" | "tasks" | "milestones"
  add(page: Page, text: string): Promise<void>
  row(page: Page, text: string): Locator
  deleteLabel(text: string): string
  /** Runs after every visit to the tab, e.g. to expand a collapsed list. */
  reveal?(page: Page): Promise<void>
}

export const byTestId = (id: string) => (page: Page, text: string) =>
  page.getByTestId(id).filter({ hasText: text })
