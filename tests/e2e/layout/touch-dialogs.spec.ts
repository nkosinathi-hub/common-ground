import { expect, test } from "@playwright/test"
import { navigateSection, quickCapture } from "../support/navigation"

test("a normal touch reveals routes before the page action @mobile", async ({ page }, info) => {
  test.skip(info.project.name === "desktop", "Touch navigation is exercised on touch profiles")
  await page.goto("./#/demo")
  const action = page.locator(".fan-trigger")
  const { x, y } = await action.evaluate((el) => {
    const box = el.getBoundingClientRect()
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  })
  await page.touchscreen.tap(x, y)
  await expect(action).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(
    page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link"),
  ).toHaveCount(5)
})

test("touch dialogs stay usable without unsolicited text focus or tiny fields @mobile", async ({
  page,
}, info) => {
  test.skip(info.project.name === "desktop", "The desktop typing shortcut has separate coverage")
  await page.goto("./#/demo")
  await navigateSection(page, "Watch")
  for (let attempt = 0; attempt < 2; attempt++) {
    await quickCapture(page)
    const dialog = page.getByRole("dialog", { name: "Catch it before it goes" })
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeFocused()
    const input = dialog.getByRole("textbox", { name: "Idea", exact: true })
    expect(
      await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16)
    await input.fill("Touch stays intentional")
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByRole("button", { name: "Common Ground menu", exact: true }),
    ).toBeFocused()
    expect(await page.evaluate(() => getComputedStyle(document.body).pointerEvents)).not.toBe(
      "none",
    )
  }
})
