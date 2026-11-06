import { expect, type Page } from "@playwright/test"

export async function titleDetails(page: Page) {
  const dialog = page.getByRole("dialog", { name: "About this title", exact: true })
  if (!(await dialog.isVisible())) {
    await page.getByRole("button", { name: "About this title", exact: true }).first().click()
  }
  await expect(dialog).toBeVisible()
  return dialog
}

export async function titleActivity(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  const summary = page.locator("summary", { hasText: "Progress and discussion" })
  if (
    (await summary.count()) &&
    !(await summary.locator("..").evaluate((node) => (node as HTMLDetailsElement).open))
  )
    await summary.click()
}

export async function titleActions(page: Page) {
  const trigger = page.locator(".fan-trigger")
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    if (await page.evaluate(() => matchMedia("(pointer: coarse)").matches)) await trigger.tap()
    else await trigger.hover()
  }
  return page.getByRole("navigation", { name: "Main", exact: true })
}
