import { expect, test } from "@playwright/test"
import { createSpace, signIn } from "../support/session"
import { admin, createUser, requireStack } from "../support/stack"

requireStack()

const TOTAL = 150

/** Seeds watch items straight into the table: one insert, so they share one created_at. */
async function seedTitles(spaceId: string): Promise<string[]> {
  const rows = Array.from({ length: TOTAL }, (_, i) => ({
    space_id: spaceId,
    title: `Paged title ${String(i).padStart(3, "0")}`,
    media_type: "movie",
  }))
  const { data, error } = await admin().from("watch_items").insert(rows).select("id")
  if (error) throw error
  return (data as { id: string }[]).map((row) => row.id)
}

// #9 acceptance: the watch list pages by keyset, so every title shows exactly once.
test("Load more pages through 150 titles with no duplicates or gaps", async ({ page }) => {
  test.setTimeout(120_000)
  await signIn(page, await createUser("pager"))
  const spaceId = await createSpace(page, "Paging test")
  const seeded = await seedTitles(spaceId)

  await page.goto(`./#/s/${spaceId}/watch`)
  const region = page.getByRole("region", { name: "Watch" })
  const cards = region.getByRole("listitem")
  await expect(cards).toHaveCount(50)
  const more = region.getByRole("button", { name: "Load more" })
  for (const shown of [100, 150]) {
    await more.click()
    await expect(cards).toHaveCount(shown)
  }
  // The last full page already knows it is the last, so the button goes without an empty click.
  await expect(more).toBeHidden()
  await expect(cards).toHaveCount(TOTAL)

  const hrefs = await region
    .getByRole("listitem")
    .getByRole("link")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""))
  const ids = hrefs.map((href) => href.split("/watch/")[1])
  expect(new Set(ids).size).toBe(TOTAL)
  expect([...ids].sort()).toEqual([...seeded].sort())
})
