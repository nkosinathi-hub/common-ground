import { expect, test } from "@playwright/test"
import { expectAccessible } from "../support/a11y"
import { tabTo } from "../support/keyboard"
import { openNavigation, openSearch } from "../support/navigation"

test("icon search and semicircle navigation remain accessible @a11y", async ({ page }, info) => {
  await page.goto("./#/demo")
  await expect(page.getByRole("heading", { name: /Good .*, Ana/ })).toBeVisible()
  await tabTo(page, page.getByRole("link", { name: "Skip to content" }))
  await page.keyboard.press("Enter")
  await expect(page.locator("main")).toBeFocused()
  await expectAccessible(page)
  const nav = await openNavigation(page)
  await expectAccessible(page)
  await nav.getByRole("link", { name: "Watch", exact: true }).click()
  const input = await openSearch(page)
  await input.fill("Ted")
  await expect(page.getByRole("link", { name: "Open Ted Lasso", exact: true })).toBeVisible()
  await expectAccessible(page)
  await page.screenshot({ path: info.outputPath("watch-search.png") })
  await page.keyboard.press("Escape")
  const more = page.getByRole("button", { name: "More", exact: true })
  await more.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("link", { name: "Account and data" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(more).toBeFocused()
  await page.emulateMedia({ colorScheme: "dark" })
  await expect(page.locator("html")).toHaveClass(/dark/)
  await openSearch(page)
  await expectAccessible(page)
  await page.screenshot({ path: info.outputPath("watch-search-dark.png") })
})
