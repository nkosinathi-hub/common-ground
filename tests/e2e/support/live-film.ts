import { expect, type Page } from "@playwright/test"
import { admin } from "./stack"

/** A film row in a space's watch list, by TMDB id, past RLS with the admin client. */
export async function seedFilm(spaceId: string, title: string, tmdbId: number): Promise<string> {
  const row = { space_id: spaceId, title, media_type: "movie", catalog_type: "movie" }
  const { data, error } = await admin()
    .from("watch_items")
    .insert({ ...row, catalog_id: tmdbId })
    .select("id")
    .single()
  if (error) throw error
  return String(data.id)
}

export interface Playing {
  readonly src: string
  readonly paused: boolean
  readonly width: number
}

/** Presses Play on the open item page and waits until the app's own player is past 2 seconds. */
export async function playInApp(page: Page, timeout = 45_000): Promise<Playing> {
  await page.getByRole("button", { name: "Play", exact: true }).click()
  const video = page.locator("video")
  await expect(video).toBeVisible({ timeout })
  // Playback starts from a user gesture (iOS needs one): the player's own "k" shortcut.
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState), { timeout })
    .toBeGreaterThan(0)
  await video.focus()
  await page.keyboard.press("k")
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout })
    .toBeGreaterThan(2)
  return video.evaluate((v: HTMLVideoElement) => ({
    src: v.currentSrc,
    paused: v.paused,
    width: v.videoWidth,
  }))
}
