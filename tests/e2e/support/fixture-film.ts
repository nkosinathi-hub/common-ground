import type { Page } from "@playwright/test"
import type { CatalogEntry, MediaServer } from "./media-server"
import { createSpace, signIn } from "./session"
import { admin, createUser } from "./stack"

export async function openFixtureFilm(page: Page, media: MediaServer, sources: CatalogEntry[]) {
  media.catalog = sources
  media.requests.length = 0
  await signIn(page, await createUser("formats"))
  const spaceId = await createSpace(page, "Formats")
  const row = { space_id: spaceId, title: "Fixture film", media_type: "movie" }
  const { data, error } = await admin()
    .from("watch_items")
    .insert({ ...row, catalog_type: "movie", catalog_id: 603 })
    .select("id")
    .single()
  if (error) throw error
  await page.goto(`./#/s/${spaceId}/watch/${String(data.id)}`)
  await page.getByRole("button", { name: "Play", exact: true }).click()
}
