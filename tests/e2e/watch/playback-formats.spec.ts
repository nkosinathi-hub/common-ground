import { expect, test, type Page } from "@playwright/test"
import { MEDIA_ORIGIN, MediaServer, type CatalogEntry } from "../support/media-server"
import { createSpace, signIn } from "../support/session"
import { admin, createUser, requireStack } from "../support/stack"

requireStack()

// The real player (shaka for HLS and DASH, the video element for files) in a real browser, fed
// by the loopback fixture provider. TMDB 603 matches no other compiled-in source.
const media = new MediaServer()
test.beforeAll(() => media.start())
test.afterAll(() => media.stop())

const violations: string[] = []
test.beforeEach(({ page }) => {
  violations.length = 0
  page.on("console", (m) => /Content.Security.Policy/i.test(m.text()) && violations.push(m.text()))
})
test.afterEach(() => expect(violations).toEqual([]))

async function openFilm(page: Page, sources: CatalogEntry[]) {
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

/** Starts playback with the player's own shortcut, then waits for the one-second clip to end. */
async function played(page: Page) {
  const video = page.locator("video")
  await expect(video).toBeVisible({ timeout: 20_000 })
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThan(1)
  await video.focus()
  await page.keyboard.press("k")
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.ended)).toBe(true)
  return video.evaluate((v: HTMLVideoElement) => ({ src: v.currentSrc, width: v.videoWidth }))
}

for (const [kind, path] of [
  ["hls", "/hls/index.m3u8"],
  ["dash", "/dash/manifest.mpd"],
] as const) {
  test(`${kind} plays through shaka in the browser`, async ({ page }) => {
    await openFilm(page, [{ path, kind }])
    const result = await played(page)
    expect(result.src.startsWith("blob:")).toBe(true) // Media Source Extensions, not a file URL
    expect(result.width).toBeGreaterThan(0)
    expect(media.requests).toContain(path)
  })
}

test("a direct file plays in the video element", async ({ page }) => {
  await openFilm(page, [{ path: "/sample.mp4", kind: "file" }])
  const result = await played(page)
  expect(result.src).toBe(`${MEDIA_ORIGIN}/sample.mp4`)
  expect(result.width).toBeGreaterThan(0)
})

test("a broken stream falls back to the next source on its own", async ({ page }) => {
  await openFilm(page, [
    { path: "/missing.m3u8", kind: "hls", quality: 1080 },
    { path: "/sample.mp4", kind: "file", quality: 360 },
  ])
  const result = await played(page)
  expect(media.requests.indexOf("/missing.m3u8")).toBeGreaterThanOrEqual(0)
  expect(result.src).toBe(`${MEDIA_ORIGIN}/sample.mp4`)
})
