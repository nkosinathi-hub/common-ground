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
