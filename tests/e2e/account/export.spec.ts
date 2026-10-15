import { expect, test } from "@playwright/test"
import { createSpace, signIn } from "../support/session"
import { createUser } from "../support/stack"
import { addIdea, exportFrom } from "./content"

test("a member downloads a space export and their own data", async ({ page }) => {
  test.setTimeout(120_000)
  const ana = await createUser("ana")
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Weekend Plans")
  await addIdea(ana, spaceId, "Pottery class")

  await page.goto("./#/account")
  await expect(page.getByRole("heading", { name: "Account and data" })).toBeVisible()
  const space = await exportFrom(page, "Export Weekend Plans")
  expect(space.space.name).toBe("Weekend Plans")
  expect(space.members.map((m) => m.display_name)).toEqual(["ana"])
  expect(space.tables.ideas.map((i) => i.title)).toEqual(["Pottery class"])
  expect(Object.keys(space.tables)).not.toContain("space_invites")

  const me = await exportFrom<{ email: string; counts: { ideas: number } }>(
    page,
    "Download my data",
  )
  expect(me.email).toBe(ana.email)
  expect(me.counts.ideas).toBe(1)

  await page.getByRole("link", { name: "How we handle your data" }).click()
  await expect(page.getByRole("heading", { name: "Deleting your account" })).toBeVisible()
})
