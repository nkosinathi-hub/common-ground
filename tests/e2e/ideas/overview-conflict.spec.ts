import { expect, test, type Page } from "@playwright/test"
import { captureIdea } from "../support/fixtures"
import { createSpace, secondMember, signIn } from "../support/session"
import { createUser } from "../support/stack"

const pitch = (page: Page) => page.getByLabel("The plan, in a few words")

async function save(page: Page, text: string) {
  await pitch(page).fill(text)
  await page.getByRole("button", { name: "Save overview" }).click()
}

// #13 acceptance: two contexts editing one overview get a merge prompt, never a silent overwrite.
test("a stale overview save asks to merge instead of overwriting", async ({ page, browser }) => {
  test.setTimeout(180_000)
  const ana = await createUser("merger")
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Merge test")
  await captureIdea(page, spaceId, "Tea bar")

  const other = await secondMember(browser, ana)
  await other.goto(page.url())
  await expect(pitch(other)).toBeVisible()

  await save(page, "Matcha by the station")
  await expect(page.getByText("Overview saved")).toBeVisible()

  await save(other, "Rooibos on the beach")
  const merge = other.getByTestId("brief-merge")
  await expect(merge).toBeVisible()
  await expect(merge.getByText("Matcha by the station")).toBeVisible()

  await page.reload()
  await expect(pitch(page)).toHaveValue("Matcha by the station")

  await merge.getByRole("radio").nth(1).check()
  await merge.getByRole("button", { name: "Save merged overview" }).click()
  await expect(other.getByText("Overview saved")).toBeVisible()
  await other.reload()
  await expect(pitch(other)).toHaveValue("Matcha by the station")
  await other.context().close()
})
