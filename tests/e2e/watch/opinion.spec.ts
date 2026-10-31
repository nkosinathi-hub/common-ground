import { expect, test } from "@playwright/test"
import { addTitle } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()

// v0.6.1: liking was refused ("You do not have access to that"); it must save, change and stay.
test("a member likes a title, changes their mind and keeps it after a reload", async ({ page }) => {
  test.setTimeout(120_000)
  await signIn(page, await createUser("likes"))
  const spaceId = await createSpace(page, "Likes")
  await addTitle(page, spaceId, "Arrival")
  const liked = page.getByRole("button", { name: "I liked it" }).first()
  const notForMe = page.getByRole("button", { name: "Not for me" }).first()
  await liked.click()
  await expect(liked).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("alert")).toHaveCount(0)
  await notForMe.click()
  await expect(notForMe).toHaveAttribute("aria-pressed", "true")
  await page.reload()
  await expect(page.getByRole("button", { name: "Not for me" }).first()).toHaveAttribute(
    "aria-pressed",
    "true",
  )
})
