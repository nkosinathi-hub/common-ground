import { expect, type Locator, type Page } from "@playwright/test"
import type { ItemKind } from "./item-kind"
import { PLAN_KINDS } from "./plan-items"
import { RESEARCH_KINDS } from "./research-items"

export type { ItemKind }
export const ITEM_KINDS: readonly ItemKind[] = [...RESEARCH_KINDS, ...PLAN_KINDS]

/** An item's delete: in its row, or where openForDelete puts it (a menu or an editor). */
export async function findDelete(page: Page, kind: ItemKind, text: string): Promise<Locator> {
  await kind.openForDelete?.(page, text)
  return deleteControl(page, kind, text)
}

function deleteControl(page: Page, kind: ItemKind, text: string): Locator {
  const scope = kind.openForDelete ? page : kind.row(page, text)
  return scope.getByRole(kind.deleteRole ?? "button", { name: kind.deleteLabel(text) })
}

/** Clicks an item's delete button and returns the confirm dialog it opens. */
export async function askDelete(page: Page, kind: ItemKind, text: string): Promise<Locator> {
  await (await findDelete(page, kind, text)).click()
  const dialog = page.getByRole("alertdialog")
  await expect(dialog).toBeVisible()
  return dialog
}
