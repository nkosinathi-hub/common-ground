import { expect, test } from "@playwright/test"
import { createSpace, secondMember, signIn } from "../support/session"
import { createUser } from "../support/stack"
import { addIdea, exportFrom, join } from "./content"

test("deleting an account keeps shared content without the author", async ({ page, browser }) => {
  test.setTimeout(180_000)
  const [ana, ben] = await Promise.all([createUser("ana"), createUser("ben")])
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Shared Home")
  await join(ben, spaceId)
  await addIdea(ben, spaceId, "Paint the fence")

  await page.goto("./#/account/data")
  await page.getByLabel("Your password").fill(ana.password)
  await page.getByLabel("Type DELETE to confirm").fill("DELETE")
  await page.getByRole("button", { name: "Delete account…" }).click()
  await expect(page.getByRole("alert")).toHaveText(
    "make someone else an owner or delete your shared spaces first",
  )

  const benPage = await secondMember(browser, ben)
  await benPage.goto("./#/account/data")
  await benPage.getByLabel("Your password").fill("wrong password")
  await benPage.getByLabel("Type DELETE to confirm").fill("DELETE")
  await benPage.getByRole("button", { name: "Delete account…" }).click()
  await expect(benPage.getByText("Password is incorrect")).toBeVisible()
  await benPage.getByLabel("Your password").fill(ben.password)
  await benPage.getByRole("button", { name: "Delete account…" }).click()
  await benPage.waitForURL(/#\/auth\/sign-in/)

  await page.reload()
  const space = await exportFrom(page, "Export Shared Home")
  expect(space.members.map((m) => m.display_name)).toEqual(["ana"])
  expect(space.tables.ideas).toEqual([
    expect.objectContaining({ title: "Paint the fence", created_by: null }),
  ])
})
