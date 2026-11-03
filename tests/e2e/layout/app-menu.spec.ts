import { expect, test } from "@playwright/test"
import { expectAccessible } from "../support/a11y"

test("the Common Ground logo holds workspace and account tools @mobile", async ({ page }) => {
  await page.goto("./#/demo")
  const header = page.locator("header").first()
  const menu = header.getByRole("button", { name: "Common Ground menu", exact: true })
  await expect(menu.locator("svg")).toBeVisible()
  await expect(header.getByRole("button", { name: "More", exact: true })).toHaveCount(0)
  await expect(header.getByRole("button", { name: "Switch space", exact: true })).toHaveCount(0)
  await menu.click()
  const tools = page.getByRole("dialog", { name: "Common Ground menu", exact: true })
  await expect(tools.getByRole("button", { name: "Navigate", exact: true })).toBeVisible()
  await expect(tools.getByRole("link", { name: "Space settings", exact: true })).toBeVisible()
  await expect(tools.getByRole("link", { name: "Account and data", exact: true })).toBeVisible()
  await tools.getByText("Your spaces", { exact: true }).click()
  await tools.getByRole("link", { name: /Book club/ }).click()
  await expect(page.getByRole("heading", { name: /Good .*, Ana/ })).toBeVisible()
  await expect(page).toHaveURL(/000000000004\/home$/)
  await menu.click()
  await expectAccessible(page)
  await page.keyboard.press("Escape")
  await expect(menu).toBeFocused()
})

test("the primary action keeps a contrasting surface over the collection @mobile", async ({
  page,
}, info) => {
  await page.goto("./?demo=1#/s/00000000-0000-4000-a000-000000000001/watch")
  const action = page.locator(".fan-trigger")
  await expect(action).toBeVisible()
  const paint = await action.evaluate((el) => {
    const css = getComputedStyle(el)
    return { background: css.backgroundColor, shadow: css.boxShadow }
  })
  expect(paint.background).not.toBe("rgba(0, 0, 0, 0)")
  expect(paint.shadow).not.toBe("none")
  await page.screenshot({ path: info.outputPath("visible-primary-action.png") })
})
