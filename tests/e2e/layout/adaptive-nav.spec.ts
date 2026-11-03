import { expect, test } from "@playwright/test"
import {
  activatePageAction,
  navigateSection,
  openNavigation,
  openSearch,
} from "../support/navigation"

test("one universal search and contextual actions across all routes @mobile", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("./#/demo")
  await expect(page.getByRole("heading", { name: /Good .*, Ana/ })).toBeVisible()
  await navigateSection(page, "Watch")
  await expect(
    page.locator("header").first().getByRole("button", { name: "Add a title", exact: true }),
  ).toHaveCount(0)
  await expect(page.locator(".fan-trigger")).toBeVisible()
  await activatePageAction(page, "Add a title")
  const search = page.getByRole("searchbox", { name: "Search everything" })
  await expect(search).toBeFocused()
  await search.fill("Ted")
  await expect(page.getByRole("link", { name: "Open Ted Lasso", exact: true })).toBeVisible()
  await expect(page.getByRole("searchbox")).toHaveCount(1)
  await page.keyboard.press("Escape")
  await navigateSection(page, "Notes")
  await activatePageAction(page, "Write a note")
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await navigateSection(page, "Calendar")
  await activatePageAction(page, "New event")
  await expect(page.getByRole("dialog", { name: "Make a little time" })).toBeVisible()
  await page.keyboard.press("Escape")
  await navigateSection(page, "Ideas")
  await activatePageAction(page, "Capture idea")
  await expect(page.getByRole("dialog", { name: "Catch it before it goes" })).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "Common Ground menu", exact: true }).click()
  await page.getByRole("link", { name: "Account and data", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Account and data", exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test("semicircle stays centred, clear and usable at every width @mobile", async ({
  page,
}, info) => {
  await page.goto("./#/demo")
  await page.emulateMedia({ reducedMotion: "reduce" })
  for (const width of [320, 390, 640, 820, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForFunction(() => document.getAnimations().length === 0)
    const main = await page.locator("main").evaluate((el) => ({
      left: el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft),
      right: el.getBoundingClientRect().right - parseFloat(getComputedStyle(el).paddingRight),
    }))
    const menu = (await page
      .getByRole("button", { name: "Common Ground menu", exact: true })
      .boundingBox())!
    const search = (await page.getByRole("search", { name: "Workspace" }).boundingBox())!
    expect(Math.abs(menu.x - main.left)).toBeLessThan(1)
    expect(Math.abs(search.x + search.width - main.right)).toBeLessThan(1)
    const nav = await openNavigation(page)
    const center = (await page.locator(".fan-trigger").boundingBox())!
    expect(Math.abs(center.x + center.width / 2 - width / 2)).toBeLessThan(1)
    const boxes = []
    for (const link of await nav.getByRole("link").all()) {
      const box = (await link.boundingBox())!
      boxes.push(box)
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      expect(box.y + box.height).toBeLessThan(center.y + center.height)
    }
    expect(boxes[2]!.y).toBeLessThan(boxes[0]!.y)
    for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.x).toBeGreaterThan(boxes[i - 1]!.x)
    await page.screenshot({ path: info.outputPath(`fan-${width}.png`) })
    await page.keyboard.press("Escape")
    const input = await openSearch(page)
    await expect
      .poll(
        async () => (await page.getByRole("search", { name: "Workspace" }).boundingBox())!.width,
      )
      .toBeCloseTo(main.right - main.left, 0)
    await input.fill("Ted")
    await expect(page.getByRole("link", { name: "Open Ted Lasso", exact: true })).toBeVisible()
    const panel = (await page.getByRole("region", { name: "Search results" }).boundingBox())!
    expect(panel.x).toBeGreaterThanOrEqual(0)
    expect(panel.x + panel.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    await page.keyboard.press("Escape")
  }
})
