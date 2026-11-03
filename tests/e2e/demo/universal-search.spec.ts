import { expect, test } from "@playwright/test"
import { navigateSection, openSearch } from "../support/navigation"

test("universal search opens the exact note and idea task from any route @mobile", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("./#/demo")
  await navigateSection(page, "Watch")
  const input = await openSearch(page)
  await input.fill("lovely campsite")
  const matches = page.getByRole("region", { name: "Workspace matches" })
  await matches.getByRole("link", { name: /I found a lovely campsite/ }).click()
  await expect(page).toHaveURL(/home\/notes\/00000000-0000-4000-a000-000000000050$/)
  await expect(page.getByRole("list", { name: "Selected note" })).toContainText(
    "I found a lovely campsite",
  )
  await expect(page.getByRole("list", { name: "Selected note" })).toContainText(
    "Let's make a plan together.",
  )
  await openSearch(page)
  await input.fill("Compare two campsites")
  await matches.getByRole("link", { name: /Compare two campsites/ }).click()
  await expect(page).toHaveURL(/ideas\/00000000-0000-4000-a000-000000000020\/tasks$/)
  await expect(
    page.getByRole("heading", { name: "A weekend in the Cederberg", exact: true }),
  ).toBeVisible()
  await expect(page.getByRole("searchbox")).toHaveCount(0)
  expect(errors).toEqual([])
})

test("universal search preserves discussion spoilers and navigates to events", async ({ page }) => {
  await page.goto("./#/demo")
  const input = await openSearch(page)
  const matches = page.getByRole("region", { name: "Workspace matches" })
  await input.fill("biscuits")
  await expect(matches.getByRole("link", { name: /Favourite moment: the biscuits/ })).toBeVisible()
  await input.fill("Rebecca let Trent")
  await expect(matches.getByRole("link")).toHaveCount(0)
  await expect(matches.getByText("No saved matches. Catalog results are below.")).toBeVisible()
  await input.fill("Pick a film together")
  await matches.getByRole("link", { name: /Pick a film together/ }).click()
  await expect(page).toHaveURL(/calendar\/00000000-0000-4000-a000-000000000040$/)
  await expect(
    page.getByRole("heading", { name: "Pick a film together", exact: true }),
  ).toBeVisible()
})
