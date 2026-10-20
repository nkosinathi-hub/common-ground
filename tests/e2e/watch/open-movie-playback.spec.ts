import { expect, test } from "@playwright/test"
import { createSpace, signIn } from "../support/session"
import { admin, createUser, requireStack } from "../support/stack"

requireStack()
// Plays a real film from video.blender.org, so it needs the internet: E2E_LIVE=1 opts in.
test.skip(!process.env.E2E_LIVE, "live playback; set E2E_LIVE=1 to run it")

const BIG_BUCK_BUNNY = 10378

async function seedFilm(spaceId: string): Promise<string> {
  const row = {
    space_id: spaceId,
    title: "Big Buck Bunny",
    media_type: "movie",
    catalog_type: "movie",
    catalog_id: BIG_BUCK_BUNNY,
  }
  const { data, error } = await admin().from("watch_items").insert(row).select("id").single()
  if (error) throw error
  return String(data.id)
}

test("an openly licensed film plays from the PeerTube adapter in the app's own player", async ({
  page,
}) => {
  test.setTimeout(120_000)
  const violations: string[] = []
  page.on("console", (m) => /Content.Security.Policy/i.test(m.text()) && violations.push(m.text()))
  await signIn(page, await createUser("viewer"))
  const spaceId = await createSpace(page, "Open movies")
  const itemId = await seedFilm(spaceId)

  await page.goto(`./#/s/${spaceId}/watch/${itemId}`)
  await page.getByRole("button", { name: "Play", exact: true }).click()
  const video = page.locator("video")
  await expect(video).toBeVisible({ timeout: 30_000 })
  // Playback starts from a user gesture (iOS needs one): the player's own "k" shortcut.
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThan(0)
  await video.focus()
  await page.keyboard.press("k")
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 45_000 })
    .toBeGreaterThan(2)
  const playing = await video.evaluate((v: HTMLVideoElement) => ({
    src: v.currentSrc,
    paused: v.paused,
    width: v.videoWidth,
  }))
  expect(new URL(playing.src).origin).toBe("https://video.blender.org")
  expect(playing.paused).toBe(false)
  expect(playing.width).toBeGreaterThan(0)
  await page.screenshot({ path: "test-results/open-movie-playing.png" })
  expect(violations).toEqual([])
})
