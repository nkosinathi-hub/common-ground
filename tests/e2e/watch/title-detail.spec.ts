import { expect, test } from "@playwright/test"
import { navigateSection } from "../support/navigation"
import { titleActions, titleActivity, titleDetails } from "../support/title"
import { expectAccessible } from "../support/a11y"

const TITLE =
  "/?demo=1#/s/00000000-0000-4000-a000-000000000001/watch/00000000-0000-4000-a000-000000000010"

test("episodes lead the title page and its FAB exposes contextual actions @mobile", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(TITLE)
  const episodes = page.getByRole("heading", { name: "Episodes", exact: true })
  await expect(episodes).toBeVisible()
  const rows = page.getByRole("list", { name: "Episodes", exact: true })
  await expect(rows.getByRole("button").first()).toBeVisible()
  const box = await rows.getByRole("button").first().boundingBox()
  expect(box!.y + box!.height).toBeLessThan(page.viewportSize()!.height - 100)
  await expect(page.getByRole("region", { name: "Where to watch" })).toHaveCount(0)
  await expect(page.getByRole("region", { name: "Progress", exact: true })).toBeHidden()
  await page.getByRole("combobox", { name: "Season", exact: true }).selectOption("2")
  await expect(rows.getByRole("button").first()).toHaveAccessibleName(/^Play S2 E1:/)
  const fan = await titleActions(page)
  for (const name of [
    "Episodes",
    "Watch trailer",
    "Watch together",
    "About this title",
    "Navigate",
  ])
    await expect(fan.getByRole("button", { name, exact: true })).toBeVisible()
  await fan.getByRole("button", { name: "Episodes", exact: true }).click()
  await expect(episodes).toBeFocused()
  await titleActions(page)
  await expect(page.locator(".fan-trigger")).toHaveAccessibleName(/Continue S1 E/)
  await page.keyboard.press("Escape")
  await expectAccessible(page)
  await titleDetails(page)
  await expect(page.getByRole("button", { name: "Recommend", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await titleActivity(page)
  await expect(page.getByRole("region", { name: "Progress", exact: true })).toBeVisible()
  await page.goto(TITLE)
  const actions = await titleActions(page)
  await actions.getByRole("button", { name: "Watch together", exact: true }).click()
  await expect(page.getByRole("dialog", { name: "Watch together", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await (await titleActions(page)).getByRole("button", { name: "Navigate", exact: true }).click()
  await expect(
    page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link"),
  ).toHaveCount(5)
  await navigateSection(page, "Home")
  expect(errors).toEqual([])
})
