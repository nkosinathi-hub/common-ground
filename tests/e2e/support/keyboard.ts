import { expect, type Locator, type Page } from "@playwright/test"

const isFocused = (target: Locator) =>
  target.evaluate((node) => node === document.activeElement).catch(() => false)

/** Presses Tab until `target` has focus, failing after `max` presses. */
export async function tabTo(page: Page, target: Locator, max = 40): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (await isFocused(target)) return
    await page.keyboard.press("Tab")
  }
  await expect(target).toBeFocused()
}

const holdsFocus = (dialog: Locator) =>
  dialog.evaluate((node) => node.contains(document.activeElement))

/**
 * Opens a modal from its trigger with Enter, checks Tab and Shift+Tab never leave it, closes it
 * with Escape and checks focus is back on the trigger.
 */
export async function expectFocusTrap(page: Page, trigger: Locator, dialog: Locator) {
  await trigger.focus()
  await page.keyboard.press("Enter")
  await expect(dialog).toBeVisible()
  await expect.poll(() => holdsFocus(dialog)).toBe(true)
  for (const key of [...Array<string>(12).fill("Tab"), ...Array<string>(6).fill("Shift+Tab")]) {
    await page.keyboard.press(key)
    expect(await holdsFocus(dialog), `focus escaped the dialog after ${key}`).toBe(true)
  }
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
}
