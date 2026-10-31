import { expect, test, type Page } from "@playwright/test"
import { addTitle, inviteMember } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { recommend } from "../support/social"
import { admin, createUser, requireStack } from "../support/stack"

requireStack()

/** Statuses of every recommendation of one title, read past RLS. */
async function statuses(itemId: string): Promise<string[]> {
  const { data, error } = await admin()
    .from("recommendations")
    .select("status")
    .eq("watch_item_id", itemId)
    .order("created_at")
  if (error) throw error
  return (data as { status: string }[]).map((row) => row.status)
}

/** Ben's home inbox after a fresh load. */
async function inbox(page: Page, spaceId: string) {
  await page.goto(`./#/s/${spaceId}/home`)
  await page.reload()
  return page.getByRole("region", { name: "Recommended to you" })
}

// #12 acceptance: a recommendation reaches the inbox once, and an answer clears it for good.
test("a recommendation is answered once and never waits twice", async ({ page, browser }) => {
  test.setTimeout(180_000)
  const [ana, ben] = await Promise.all([createUser("ana"), createUser("ben")])
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Recommend test")
  const benPage = await inviteMember(page, browser, spaceId, ben)
  const itemId = await addTitle(page, spaceId, "Arrival")

  await recommend(page, "ben", "Linguistics!")
  await page.getByRole("button", { name: "Recommend" }).click()
  const again = page.getByRole("dialog", { name: "Recommend a title" })
  await again.getByRole("button", { name: "ben", exact: true }).click()
  await again.getByRole("button", { name: "Send" }).click()
  await expect(again.getByRole("alert")).toContainText("already has this recommendation waiting")
  await page.keyboard.press("Escape")
  expect(await statuses(itemId)).toEqual(["pending"])

  let box = await inbox(benPage, spaceId)
  await expect(box.getByRole("link", { name: "Arrival" })).toHaveCount(1)
  await expect(box).toContainText("From ana")
  await expect(box).toContainText("Linguistics!")
  await box.getByRole("button", { name: "Dismiss Arrival" }).click()
  // Answered, it leaves the inbox; For you may still suggest the title from the space's list.
  await expect(box.getByRole("button", { name: "Dismiss Arrival" })).toBeHidden()
  box = await inbox(benPage, spaceId)
  await expect(box).not.toContainText("Linguistics!")

  await recommend(page, "ben", "Second try")
  box = await inbox(benPage, spaceId)
  await expect(box.getByRole("link", { name: "Arrival" })).toHaveCount(1)
  await box.getByRole("button", { name: "Acknowledge Arrival" }).click()
  await expect(box.getByRole("button", { name: "Acknowledge Arrival" })).toBeHidden()
  expect(await statuses(itemId)).toEqual(["dismissed", "acknowledged"])
  await benPage.context().close()
})
