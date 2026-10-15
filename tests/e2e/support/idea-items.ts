import { expect, type Locator, type Page } from "@playwright/test"
import type { ItemKind } from "./item-kind"
import { PLAN_KINDS } from "./plan-items"
import { RESEARCH_KINDS } from "./research-items"

export type { ItemKind }
export const ITEM_KINDS: readonly ItemKind[] = [...RESEARCH_KINDS, ...PLAN_KINDS]

/** Clicks an item's delete button and returns the confirm dialog it opens. */
export async function askDelete(page: Page, kind: ItemKind, text: string): Promise<Locator> {
  await kind
    .row(page, text)
    .getByRole("button", { name: kind.deleteLabel(text) })
    .click()
  const dialog = page.getByRole("alertdialog")
  await expect(dialog).toBeVisible()
  return dialog
}
