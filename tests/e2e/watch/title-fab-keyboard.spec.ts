import { expect, test } from "@playwright/test"

test("title actions and global routes can be reached immediately by keyboard", async ({ page }) => {
  await page.goto(
    "/?demo=1#/s/00000000-0000-4000-a000-000000000001/watch/00000000-0000-4000-a000-000000000010",
  )
  await expect(
    page.getByRole("list", { name: "Episodes", exact: true }).getByRole("button").first(),
  ).toBeVisible()
  const fan = page.getByRole("navigation", { name: "Main", exact: true })
  const primary = page.locator(".fan-trigger")
  await primary.focus()
  await page.keyboard.press("ArrowRight")
  await expect(fan.getByRole("button", { name: "Episodes", exact: true })).toBeFocused()
  await page.keyboard.press("End")
  await expect(fan.getByRole("button", { name: "Navigate", exact: true })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(fan.getByRole("link").first()).toBeFocused()
  await page.keyboard.press("End")
  await expect(fan.getByRole("link").last()).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(primary).toBeFocused()
  await expect(primary).toHaveAttribute("aria-expanded", "false")
})
