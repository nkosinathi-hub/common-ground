import { expect, test } from "@playwright/test"
import { scrollsSideways } from "../support/motion"
import { createSpace, projectPage, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"
import { addEvent } from "./calendar"

requireStack()

test.use({ timezoneId: "Europe/London" })

// #29: the month grid is one tab stop moved with arrows, Home/End and PageUp/PageDown.
test("the month grid moves by keyboard", async ({ page }) => {
  test.setTimeout(120_000)
  await signIn(page, await createUser("keys"))
  const spaceId = await createSpace(page, "Grid keys")
  await page.goto(`./#/s/${spaceId}/calendar`)
  await page.getByRole("tab", { name: "Month" }).click()
  const grid = page.getByRole("grid")
  const today = grid.locator('[role="gridcell"][tabindex="0"]')
  await expect(today).toHaveAttribute("aria-current", "date")
  const title = (await page.locator("#calendar-month-title").textContent())!.trim()
  await today.focus()
  const start = (await today.getAttribute("data-day"))!
  await page.keyboard.press("ArrowRight")
  await expect(page.locator(":focus")).toHaveAttribute("data-day", shift(start, 1))
  await page.keyboard.press("ArrowDown")
  await expect(page.locator(":focus")).toHaveAttribute("data-day", shift(start, 8))
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowLeft")
  await expect(page.locator(":focus")).toHaveAttribute("data-day", start)
  await page.keyboard.press("End")
  await expect(page.locator(":focus")).toHaveAttribute("aria-label", /^Sun /)
  await page.keyboard.press("Home")
  await expect(page.locator(":focus")).toHaveAttribute("aria-label", /^Mon /)
  await page.keyboard.press("PageDown")
  await expect(page.locator("#calendar-month-title")).not.toHaveText(title)
  await page.keyboard.press("PageUp")
  await expect(page.locator("#calendar-month-title")).toHaveText(title)
  await expect(grid.locator('[tabindex="0"]')).toHaveCount(1)
  await expect(page.locator(":focus")).toHaveAttribute("role", "gridcell")
})

// Phones open on the agenda, and nothing scrolls sideways.
test("phones get the agenda first and no sideways scroll @mobile", async ({ browser }) => {
  test.setTimeout(120_000)
  const page = await projectPage(browser, { timezoneId: "Europe/London" })
  await signIn(page, await createUser("phone"))
  const spaceId = await createSpace(page, "A calendar on a narrow phone screen")
  const day = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10)
  await addEvent(page, spaceId, {
    title: "A deliberately long event title to stress wrapping",
    start: day,
    from: "18:00",
    to: "19:00",
  })
  expect(await scrollsSideways(page)).toBe(false)
  await page.goto(`./#/s/${spaceId}/calendar`)
  const wide = (page.viewportSize()?.width ?? 0) >= 768
  await expect(page.getByRole("tab", { name: wide ? "Month" : "Agenda" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
  await expect(page.getByRole("link", { name: /deliberately long event/ }).first()).toBeVisible()
  expect(await scrollsSideways(page)).toBe(false)
  await page.getByRole("tab", { name: "Month" }).click()
  await expect(page.getByRole("grid")).toBeVisible()
  expect(await scrollsSideways(page)).toBe(false)
  await page.context().close()
})

const shift = (iso: string, days: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
