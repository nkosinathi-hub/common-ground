import { expect, test } from "@playwright/test"
import { createSpace, signIn } from "../support/session"
import { createUser } from "../support/stack"

test("add a title manually, track progress and comment", async ({ page }) => {
  test.setTimeout(180_000)
  const ana = await createUser("watcher")
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Movie nights")

  await page.goto(`./#/s/${spaceId}/watch`)
  await page.getByRole("button", { name: "Add your first title" }).click()
  await page.getByRole("button", { name: "Add a title manually" }).click()
  await page.getByLabel("Title", { exact: true }).fill("Frieren")
  await page.getByRole("button", { name: "Add to your list" }).click()
  await page
    .getByRole("link", { name: /Frieren/ })
    .first()
    .click()
  await page.waitForURL(/#\/s\/.+\/watch\/[0-9a-f-]{36}/)
  await expect(page.getByRole("heading", { name: "Frieren" })).toBeVisible()
  await expect(page.getByText(/no verified provider data/i)).toBeVisible()

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

  await page.goto(`./#/s/${spaceId}/ideas`)
  await page.getByLabel("Idea title").fill("Night market stall")
  await page.getByRole("button", { name: "Capture" }).click()
  await page
    .getByRole("link", { name: /Night market stall/ })
    .first()
    .click()
  await page.waitForURL(/#\/s\/.+\/ideas\/[0-9a-f-]{36}\/overview/)
  for (const tab of ["research", "tasks", "milestones", "discussion", "overview"]) {
    await page.goto(page.url().replace(/\/[a-z]+$/, `/${tab}`))
    await expect(page.getByLabel("Title", { exact: true }).first()).toHaveValue(
      "Night market stall",
    )
  }
})
