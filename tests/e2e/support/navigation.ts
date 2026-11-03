import { expect, type Page } from "@playwright/test"

/** Keep route assertions shared with the actual disclosure, on mouse and touch projects. */
export async function openNavigation(page: Page) {
  const trigger = page.locator(".fan-trigger")
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await page.getByRole("button", { name: "Common Ground menu", exact: true }).click()
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
export async function activatePageAction(page: Page, name: string) {
  const action = page.locator(".fan-trigger")
  if ((await action.getAttribute("aria-label")) === "Open navigation") await action.click()
  await expect(action).toHaveAccessibleName(name)
  await action.click()
}
/** Home retains an inline composer on wide screens and uses the central action on phones. */
export async function clickPageButton(page: Page, name: string) {
  const inline = page.getByRole("button", { name, exact: true })
  await expect(inline.or(page.locator(".fan-trigger")).first()).toBeVisible()
  if (await inline.count()) await inline.first().click()
  else await activatePageAction(page, name)
}
export async function openSearch(page: Page) {
  await page.getByRole("button", { name: "Open search", exact: true }).click()
  const input = page.getByRole("searchbox", { name: "Search everything", exact: true })
  await expect(input).toBeFocused()
  return input
}

/** Secondary capture stays available when the current page owns a different primary action. */
export async function quickCapture(page: Page) {
  await page.getByRole("button", { name: "Common Ground menu", exact: true }).click()
  await page
    .getByRole("dialog", { name: "Common Ground menu", exact: true })
    .getByRole("button", { name: "Capture idea", exact: true })
    .click()
}

/** Notifications remain under the logo on every screen size. */
export async function notificationControl(page: Page) {
  await page.getByRole("button", { name: "Common Ground menu", exact: true }).click()
  const control = page.getByRole("button", { name: /^Notifications/ })
  await expect(control).toBeVisible()
  return control
}

export async function openNotifications(page: Page) {
  await (await notificationControl(page)).click()
}
