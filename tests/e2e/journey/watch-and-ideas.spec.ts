import { expect, test } from "@playwright/test"
import { addTitle, captureIdea } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { createUser } from "../support/stack"

test("add a title manually, track progress and comment", async ({ page }) => {
  test.setTimeout(180_000)
  const ana = await createUser("watcher")
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Movie nights")

  await addTitle(page, spaceId, "Frieren")
  await expect(page.getByRole("heading", { name: "Frieren" })).toBeVisible()
  const where = page.getByRole("region", { name: "Where to watch" })
  await expect(where.getByText(/not a provider listing/i)).toBeVisible()

  // Phones put the discussion on its own tab; wide screens show it beside progress.
  const discussion = page.getByRole("tab", { name: "Discussion" })
  if (await discussion.isVisible()) await discussion.click()
  await page.getByLabel("Add a comment").fill("Episode 10 made me cry")
  await page.getByRole("button", { name: /^(Post|Comment|Send)$/ }).click()
  await expect(page.getByText("Episode 10 made me cry")).toBeVisible()
  await page.reload()
  await expect(page.getByText("Episode 10 made me cry")).toBeVisible()
})

test("capture an idea and open every tab", async ({ page }) => {
  test.setTimeout(180_000)
  const ana = await createUser("dreamer")
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Big plans")

  await captureIdea(page, spaceId, "Night market stall")
  for (const tab of ["research", "tasks", "milestones", "discussion", "overview"]) {
    await page.goto(page.url().replace(/\/[a-z]+$/, `/${tab}`))
    await expect(page.getByRole("heading", { level: 1, name: "Night market stall" })).toBeVisible()
  }
})

test("quick capture from any screen keeps an unsent draft", async ({ page }) => {
  test.setTimeout(120_000)
  const ana = await createUser("quick")
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Quick")
  await page.goto(`./#/s/${spaceId}/watch`)
  await page.getByRole("button", { name: "Capture an idea from anywhere" }).click()
  await page.getByLabel("Idea", { exact: true }).fill("Pop-up cinema")
  await page.reload()
  await page.getByRole("button", { name: "Capture an idea from anywhere" }).click()
  await expect(page.getByLabel("Idea", { exact: true })).toHaveValue("Pop-up cinema")
  await page.getByRole("button", { name: "Save idea" }).click()
  await expect(page.getByText("Idea saved")).toBeVisible()
  await page.goto(`./#/s/${spaceId}/ideas`)
  await expect(page.getByRole("link", { name: /Pop-up cinema/ }).first()).toBeVisible()
})
