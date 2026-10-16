import { expect, test } from "@playwright/test"
import { captureIdea, openIdeaTab } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"
import { addTask, setTaskField, written } from "../support/tasks"
import { daysFromNow } from "../support/dates"

const target = daysFromNow(50)

requireStack()

// #16 acceptance: milestones with target dates, linked tasks, completion that persists, and a
// budget whose totals render and whose currency only changes through a destructive confirmation.
test("milestones persist and the budget guards its currency", async ({ page }) => {
  test.setTimeout(240_000)
  await signIn(page, await createUser("planner"))
  const spaceId = await createSpace(page, "Milestone test")
  const ideaId = await captureIdea(page, spaceId, "Pop-up bakery")

  await openIdeaTab(page, spaceId, ideaId, "milestones")
  await page.getByLabel("Milestone title").fill("First market")
  await page.getByLabel("Target date").fill(target.iso)
  await page.getByRole("button", { name: "Add milestone" }).click()
  const milestone = page.getByTestId("milestone").filter({ hasText: "First market" })
  await expect(milestone).toContainText(`Target ${target.shown}`)

  await openIdeaTab(page, spaceId, ideaId, "tasks")
  await addTask(page, "Bake samples")
  await setTaskField(page, "Bake samples", "Milestone", "First market")

  await openIdeaTab(page, spaceId, ideaId, "milestones")
  const completed = written(page, "milestones")
  await milestone.getByRole("checkbox").check()
  await completed
  await page.reload()
  await expect(milestone.getByRole("checkbox")).toBeChecked()
  await expect(page.getByRole("heading", { name: /Milestones/ })).toContainText("1 of 1 complete")
  await openIdeaTab(page, spaceId, ideaId, "tasks")
  await expect(page.getByLabel("Milestone").locator("option:checked")).toHaveText("First market")

  await openIdeaTab(page, spaceId, ideaId, "milestones")
  await expect(page.getByLabel("Currency")).toHaveValue("ZAR")
  const line = page.getByRole("form", { name: "Add a budget line" })
  await line.getByLabel("Category").fill("Stock")
  await line.getByLabel("Item").fill("Flour")
  await line.getByLabel("Estimated (ZAR)").fill("1 500.50")
  await line.getByLabel("Actual (ZAR)").fill("1 600")
  await line.getByRole("button", { name: "Add line" }).click()
  await expect(page.getByRole("row", { name: /Flour/ })).toBeVisible()
  const summary = page.getByTestId("budget-summary")
  await expect(summary).toContainText(/Estimated\s*R\s1\s500,50/)
  await expect(summary).toContainText(/Actual\s*R\s1\s600,00/)
  // Overspend is a positive variance, flagged in the destructive colour.
  await expect(summary.getByRole("definition").nth(2)).toHaveText(/^R\s99,50$/)
  await expect(summary.getByRole("definition").nth(2)).toHaveClass(/text-destructive/)

  await page.getByLabel("Currency").selectOption("EUR")
  const change = page.getByRole("button", { name: "Change currency" })
  await expect(change).toBeDisabled()
  await page.getByLabel("Delete all 1 budget lines to switch to EUR").check()
  await change.click()
  await expect(page.getByText("No budget lines yet.")).toBeVisible()
  await page.reload()
  await expect(page.getByLabel("Currency")).toHaveValue("EUR")
  await expect(page.getByText("No budget lines yet.")).toBeVisible()
})
