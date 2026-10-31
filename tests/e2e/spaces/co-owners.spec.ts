import { expect, test } from "@playwright/test"
import { inviteMember } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()

// v0.6.1: a space can have several owners; making someone an owner keeps you one too.
test("an owner makes a member an owner too, and stays one", async ({ page, browser }) => {
  test.setTimeout(150_000)
  const [ana, ben] = await Promise.all([createUser("ana"), createUser("ben")])
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Two owners")
  const benPage = await inviteMember(page, browser, spaceId, ben)

  await page.goto(`./#/s/${spaceId}/settings/members`)
  // Inviting left this tab open; reload to list the member who just joined.
  await page.reload()
  await page.getByRole("button", { name: "More for ben", exact: true }).click()
  await page.getByRole("menuitem", { name: "Make owner" }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Make owner" }).click()
  await expect(page.getByText("ben is now an owner")).toBeVisible()
  const members = page.getByRole("region", { name: "Members" })
  await expect(members.getByText("Owner", { exact: true })).toHaveCount(2)

  // Ben's page learns his new role on its next load.
  await benPage.goto(`./#/s/${spaceId}/settings/identity`)
  await benPage.reload()
  await expect(benPage.getByLabel("Space name")).toBeVisible()
  await benPage.context().close()
})
