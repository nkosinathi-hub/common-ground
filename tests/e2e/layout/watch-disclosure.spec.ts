import { expect, test } from "@playwright/test"
import { expectAccessible } from "../support/a11y"
import { navigateSection } from "../support/navigation"

test("Watch keeps filters quiet until requested, applies once and cancels safely @mobile", async ({
  page,
}, info) => {
  await page.goto("./#/demo")
  await navigateSection(page, "Watch")
  const controls = page.getByRole("group", { name: "Collection controls" })
  await expect(controls.getByRole("button")).toHaveCount(2)
  await expect(page.getByRole("combobox")).toHaveCount(0)
  await expect(page.getByRole("radio")).toHaveCount(0)
  await expect(page.locator(".fan-trigger")).toHaveAccessibleName(
    info.project.name === "desktop" ? "Add a title" : "Open navigation",
  )
  await controls.getByRole("button", { name: "Filters", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Your collection, your way" })
  await expect(dialog).toBeVisible()
  const previous = await page
    .getByRole("list", { name: "Titles", exact: true })
    .getByRole("link")
    .count()
  await dialog.getByLabel("Type", { exact: true }).selectOption("movie")
  await expect(
    page.getByRole("list", { name: "Titles", exact: true }).getByRole("link"),
  ).toHaveCount(previous)
  await expectAccessible(page)
  await page.screenshot({ path: info.outputPath("watch-filter-options.png") })
  await dialog.getByRole("button", { name: "Apply filters" }).click()
  await expect(dialog).toBeHidden()
  await expect(controls.getByRole("button", { name: "Filters, 1 active" })).toBeVisible()
  await expect(controls.getByText("Movie", { exact: true })).toBeVisible()
  await controls.getByRole("button", { name: "Filters, 1 active" }).click()
  await dialog.getByLabel("Type", { exact: true }).selectOption("anime")
  await dialog.getByRole("button", { name: "Cancel" }).click()
  await expect(controls.getByText("Movie", { exact: true })).toBeVisible()
  await controls.getByRole("button", { name: "Clear filters", exact: true }).click()
  await expect(controls.getByRole("button")).toHaveCount(2)
  await expectAccessible(page)
  await page.screenshot({ path: info.outputPath("watch-resting.png") })
})

test("open menu hints do not cover the menu and hover never changes control bounds", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Mouse hover is exercised on desktop")
  await page.goto("./#/demo")
  await navigateSection(page, "Watch")
  const controls = page.getByRole("group", { name: "Collection controls" })
  const pick = controls.getByRole("button", { name: "Pick for us" })
  const filters = controls.getByRole("button", { name: "Filters", exact: true })
  await expect(page.getByRole("heading", { name: "Our next good watch." })).toBeVisible()
  const relativeBounds = () =>
    filters.evaluate((el) => {
      const box = el.getBoundingClientRect(),
        parent = el.closest('[aria-label="Collection controls"]')!.getBoundingClientRect()
      return { x: box.x - parent.x, y: box.y - parent.y, width: box.width, height: box.height }
    })
  const before = await relativeBounds()
  await pick.hover()
  await expect(pick.locator("[data-reveal-label]")).toHaveCSS("opacity", "1")
  expect(await relativeBounds()).toEqual(before)
  const label = (await pick.locator("[data-reveal-label]").boundingBox())!
  expect(label.y + label.height).toBeLessThanOrEqual((await pick.boundingBox())!.y)
  expect(label.x).toBeGreaterThanOrEqual(0)
  expect(label.x + label.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  const more = page.getByRole("button", { name: "Common Ground menu", exact: true })
  await more.click()
  await expect(more).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("button", { name: "Navigate", exact: true })).toBeVisible()
})
