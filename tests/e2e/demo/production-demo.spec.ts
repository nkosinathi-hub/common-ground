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
  await expect(page.getByRole("heading", { name: "Watch", exact: true })).toBeVisible()
  await page.getByRole("link", { name: /Ted Lasso poster/ }).click()
  await expect(page.getByRole("heading", { name: "Ted Lasso", exact: true })).toBeVisible()
  await expect(page.getByRole("combobox", { name: "Season", exact: true })).toBeVisible()
  await expect(
    page.getByText("Let's watch the next episode on Friday.", { exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Ted Lasso", exact: true })).toBeVisible()
  await page.getByRole("link", { name: "Ideas", exact: true }).click()
  await page.getByRole("link", { name: /A weekend in the Cederberg/ }).click()
  await expect(
    page.getByRole("heading", { name: "A weekend in the Cederberg", exact: true }),
  ).toBeVisible()
  for (const tab of ["Research", "Tasks", "Milestones", "Discussion"]) {
    await page.getByRole("link", { name: tab, exact: true }).click()
    await expect(
      page.getByRole("heading", { name: "A weekend in the Cederberg", exact: true }),
    ).toBeVisible()
  }
  await page.getByRole("link", { name: "Calendar", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Calendar", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Switch space", exact: true }).click()
  await page.getByRole("menuitem", { name: /Space settings/ }).click()
  await expect(page.getByRole("heading", { name: "Space settings", exact: true })).toBeVisible()
  await expect(page.getByText("Ben", { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
