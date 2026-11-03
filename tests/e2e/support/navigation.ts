import { expect, type Page } from "@playwright/test"

/** Keep route assertions shared with the actual disclosure, on mouse and touch projects. */
export async function openNavigation(page: Page) {
  const trigger = page.locator(".fan-trigger")
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await page.getByRole("button", { name: "More", exact: true }).click()
    await page.getByRole("button", { name: "Navigate", exact: true }).click()
  }
  const nav = page.getByRole("navigation", { name: "Main", exact: true })
  await expect(nav.getByRole("link")).toHaveCount(5)
  return nav
}
export async function navigateSection(page: Page, name: string) {
  const nav = await openNavigation(page)
  await nav.getByRole("link", { name, exact: true }).click()
}
export async function openSearch(page: Page) {
  await page.getByRole("button", { name: "Open search", exact: true }).click()
  const input = page.getByRole("searchbox", { name: "Search everything", exact: true })
  await expect(input).toBeFocused()
  return input
}

/** Secondary capture stays available when the current page owns a different primary action. */
export async function quickCapture(page: Page) {
  await page.getByRole("button", { name: "More", exact: true }).click()
  await page
    .locator('[aria-label="Space tools"]')
    .getByRole("button", { name: "Capture idea", exact: true })
    .click()
}

/** Notifications remain under More on every screen size. */
export async function notificationControl(page: Page) {
  await page.getByRole("button", { name: "More", exact: true }).click()
  const control = page.getByRole("button", { name: /^Notifications/ })
  await expect(control).toBeVisible()
  return control
}

export async function openNotifications(page: Page) {
  await (await notificationControl(page)).click()
}
