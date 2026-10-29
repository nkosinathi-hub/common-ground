import { expect, test } from "@playwright/test"
import { createSpace, secondMember, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()

test("owner invites a member who joins once; strangers see nothing", async ({ page, browser }) => {
  test.setTimeout(180_000)
  const [ana, ben, eve] = await Promise.all([
    createUser("ana"),
    createUser("ben"),
    createUser("eve"),
  ])
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Ana and Ben")

  await page.goto(`./#/s/${spaceId}/settings/members`)
  await page.getByRole("button", { name: "Create link" }).click()
  const link = (await page.locator("code").textContent())!.trim()
  const token = link.split("#/invite/")[1]!

  const benPage = await secondMember(browser, ben)
  await benPage.goto(`./#/invite/${token}`)
  await expect(benPage.getByRole("heading", { name: "Join Ana and Ben" })).toBeVisible()
  await benPage.getByRole("button", { name: "Accept and join" }).click()
  await benPage.waitForURL(new RegExp(`#/s/${spaceId}/home`))

  const evePage = await secondMember(browser, eve)
  await evePage.goto(`./#/invite/${token}`)
  await expect(evePage.getByText("already used")).toBeVisible()
  await evePage.goto(`./#/s/${spaceId}/home`)
  await expect(evePage.getByRole("heading", { name: "This page is not available" })).toBeVisible()

  await page.reload()
  await page.getByRole("button", { name: "More for ben", exact: true }).click()
  await page.getByRole("menuitem", { name: "Remove" }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click()
  await expect(page.getByText("ben was removed")).toBeVisible()
  await benPage.goto(`./#/s/${spaceId}/home`)
  await benPage.reload()
  await expect(
    benPage.getByRole("heading", { name: /space for your people|not available/ }),
  ).toBeVisible()
})
