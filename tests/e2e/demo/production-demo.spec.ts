import { expect, test } from "@playwright/test"

test("sample demo uses the real pages, details and dialogs without login @mobile", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/#/demo")
  await expect(page.getByRole("heading", { name: /Good .*, Ana/ })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Notes for you" })).toBeVisible()
  await page.getByRole("button", { name: "Write a note", exact: true }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("link", { name: "Watch", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Our next good watch." })).toBeVisible()
  await page.getByRole("link", { name: /Ted Lasso poster/ }).click()
  await expect(page.getByRole("heading", { name: "Ted Lasso", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Play an episode" }).first()).toBeVisible()
  // Sources and freshness are credited under Account, not on the title page.
  await expect(page.getByText(/Listings from/)).toHaveCount(0)
  // Phones put the discussion on its own tab; wide screens show it beside progress.
  const discussion = page.getByRole("tab", { name: "Discussion" })
  if (await discussion.isVisible()) await discussion.click()
  await expect(page.getByText(/the biscuits/)).toBeVisible()
  await expect(page.getByText(/Ben is ahead/)).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Ted Lasso", exact: true })).toBeVisible()
  await page.getByRole("link", { name: "Ideas", exact: true }).click()
  await page.getByRole("link", { name: /A weekend in the Cederberg/ }).click()
  await expect(
    page.getByRole("heading", { name: "A weekend in the Cederberg", exact: true }),
  ).toBeVisible()
  for (const tab of ["Research", "Tasks", "Milestones & budget", "Discussion"]) {
    await page.getByRole("link", { name: tab, exact: true }).click()
    await expect(
      page.getByRole("heading", { name: "A weekend in the Cederberg", exact: true }),
    ).toBeVisible()
  }
  await page.getByRole("link", { name: "Calendar", exact: true }).click()
  await expect(
    page.getByRole("heading", { level: 1, name: /Make time for each other|Time, together/ }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Switch space", exact: true }).click()
  await page.getByRole("menuitem", { name: /Space settings/ }).click()
  await expect(page.getByRole("heading", { name: "Space settings", exact: true })).toBeVisible()
  await page.getByRole("tab", { name: "Members & safety" }).click()
  await expect(
    page.getByRole("region", { name: "Members" }).getByText("Ben", { exact: true }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
