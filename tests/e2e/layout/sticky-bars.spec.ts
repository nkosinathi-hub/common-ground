import { expect, test } from "@playwright/test"

// The demo notice, the top bar (wide) and the app bar (phones) stay stacked while scrolling:
// each sticky bar sits flush under the one above it, never sliding beneath it.
test("the shell's bars stay stacked under the demo notice while scrolling @mobile", async ({
  page,
}) => {
  await page.goto("./#/demo")
  await expect(page.getByRole("heading", { name: /Good .*, Ana/ })).toBeVisible()
  await page.mouse.wheel(0, 1500)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(200)
  const notice = await page.locator("[data-demo-notice]").boundingBox()
  const bar = await page.locator("header").locator("visible=true").first().boundingBox()
  expect(notice?.y).toBe(0)
  expect(Math.round(bar!.y)).toBe(Math.round(notice!.y + notice!.height))
})
