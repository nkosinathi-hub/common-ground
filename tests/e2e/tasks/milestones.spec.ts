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
  const milestones = page.getByRole("region", { name: "Milestones", exact: true })
  await expect(milestones).toContainText("1 of 1 done")
  await expect(milestone).toContainText("1 linked task: Bake samples")
  await openIdeaTab(page, spaceId, ideaId, "tasks")
  await expect(page.getByTestId("task-card").filter({ hasText: "Bake samples" })).toContainText(
    "First market",
  )

  await openIdeaTab(page, spaceId, ideaId, "milestones")
  await expect(page.getByLabel("Currency")).toHaveValue("ZAR")
  const line = page.getByRole("form", { name: "Add budget item" })
  await line.getByLabel("Category").fill("Stock")
  await line.getByLabel("Item").fill("Flour")
  await line.getByLabel("Estimated (ZAR)").fill("1 500.50")
  await line.getByLabel("Actual (optional)").fill("1 600")
  await line.getByRole("button", { name: "Add", exact: true }).click()
  await expect(page.getByTestId("budget-line").filter({ hasText: "Flour" })).toBeVisible()
  const summary = page.getByTestId("budget-summary")
  await expect(summary).toContainText(/Estimated\s*R\s1\s500,50/)
  await expect(summary).toContainText(/Actual\s*R\s1\s600,00/)
  // Overspend is said plainly, in the destructive colour.
  const over = summary.getByText(/over the estimate/)
  await expect(over).toHaveText(/^R\s99,50 over the estimate\.$/)
  await expect(over).toHaveClass(/text-destructive/)

  // With lines in it, the currency only changes after a destructive confirmation.
  await page.getByLabel("Currency").selectOption("EUR")
  const confirm = page.getByRole("alertdialog", { name: "Switch to EUR?" })
  await confirm.getByRole("button", { name: "Cancel" }).click()
  await expect(page.getByLabel("Currency")).toHaveValue("ZAR")
  await page.getByLabel("Currency").selectOption("EUR")
  await confirm.getByRole("button", { name: "Delete lines and switch" }).click()
  await expect(page.getByText("No budget items yet.")).toBeVisible()
  await page.reload()
  await expect(page.getByLabel("Currency")).toHaveValue("EUR")
  await expect(page.getByText("No budget items yet.")).toBeVisible()
})
