import { expect, test } from "@playwright/test"
import { openNavigation, openSearch } from "../support/navigation"

test("bare search gradually frosts on hover and opens with keyboard", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Mouse hover is checked on desktop")
  await page.goto("./#/demo")
  const search = page.getByRole("search", { name: "Workspace" })
  const field = search.locator(".search-ice")
  const ice = () => field.evaluate((el) => getComputedStyle(el, "::before").opacity)
  await expect.poll(ice).toBe("0")
  expect((await search.boundingBox())!.width).toBeLessThan(50)
  await page.getByRole("button", { name: "Open search" }).hover()
  await expect.poll(ice).toBe("1")
  expect((await search.boundingBox())!.width).toBeGreaterThan(250)
  await page.mouse.move(10, 500)
  await expect.poll(ice).toBe("0")
  await page.keyboard.press("Control+k")
  const input = page.getByRole("searchbox", { name: "Search everything" })
  await expect(input).toBeFocused()
  await input.fill("Ted")
  await expect(page.getByRole("link", { name: "Open Ted Lasso", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("button", { name: "Open search" })).toBeFocused()
  await expect(page.getByRole("region", { name: "Search results" })).toHaveCount(0)
})

test("semicircle fans on hover, closes on leave and preserves keyboard routes", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Mouse hover is checked on desktop")
  await page.goto("./#/demo")
  const trigger = page.locator(".fan-trigger")
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  await trigger.hover()
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  const nav = page.getByRole("navigation", { name: "Main", exact: true })
  await expect(nav.getByRole("link")).toHaveCount(5)
  await page.screenshot({ path: info.outputPath("semicircle.png") })
  await page.mouse.move(10, 250)
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  await expect(nav.getByRole("link")).toHaveCount(0)
  await trigger.focus()
  await page.keyboard.press("ArrowUp")
  await expect(nav.getByRole("link", { name: "Calendar", exact: true })).toBeFocused()
  await page.keyboard.press("Home")
  await expect(nav.getByRole("link", { name: "Home", exact: true })).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(nav.getByRole("link", { name: "Watch", exact: true })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
})

test("touch opens routes in one tap and reduced motion stays immediate @mobile", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("./#/demo")
  const nav = await openNavigation(page)
  const notes = nav.getByRole("link", { name: "Notes", exact: true })
  const timing = await notes.evaluate((el) => getComputedStyle(el).transitionDuration)
  expect(timing.split(",").every((value) => parseFloat(value) <= 0.01)).toBe(true)
  await notes.click()
  await expect(page.getByRole("heading", { name: "Notes", exact: true })).toBeVisible()
  await expect(page.locator(".fan-trigger")).toHaveAttribute("aria-expanded", "false")
  const input = await openSearch(page)
  await input.fill("Cederberg")
  await expect(
    page.getByRole("region", { name: "Workspace matches" }).getByRole("link").first(),
  ).toBeVisible()
  await page.screenshot({ path: info.outputPath("search-ice.png") })
})
