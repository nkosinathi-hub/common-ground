import { expect, test } from "@playwright/test"
import { createSpace, signIn } from "../support/session"
import { admin, createUser, requireStack } from "../support/stack"
import { seedFilm } from "../support/live-film"
requireStack()
const origin = process.env.VITE_CINEPRO_CORE_ORIGIN
const publicIp = process.env.E2E_PUBLIC_PLAYBACK_IP
test.skip(!origin || !publicIp, "Opt in with a public DNS address, never the tailnet address")

for (const [title, id, tv] of [
  ["The Matrix", 603, false],
  ["Superman", 1061474, false],
  ["Breaking Bad", 1396, true],
] as const) {
  test(`public Funnel: ${title} sustains playback beyond one minute @mobile`, async ({
    page,
  }, info) => {
    test.setTimeout(240_000)
    const addresses: string[] = []
    page.on("response", (response) => {
      if (response.url().startsWith(origin!))
        void response.serverAddr().then((address) => address && addresses.push(address.ipAddress))
    })
    await signIn(page, await createUser("public-player"))
    const spaceId = await createSpace(page, "Public playback")
    const itemId = await seedFilm(spaceId, title, id)
    if (tv)
      await admin()
        .from("watch_items")
        .update({ media_type: "series", catalog_type: "tv" })
        .eq("id", itemId)
    await page.goto(`./#/s/${spaceId}/watch/${itemId}`)
    const action = page.locator(".fan-trigger")
    await expect(action).toHaveAccessibleName(/^(Play|Continue S)/)
    if (info.project.name === "desktop") await action.click()
    else await action.tap()
    const video = page.locator("video")
    await expect(video).toBeVisible({ timeout: 90_000 })
    if (await video.evaluate((v: HTMLVideoElement) => v.paused))
      await video.evaluate((v: HTMLVideoElement) => v.play())
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 150_000 })
      .toBeGreaterThan(100)
    expect(await video.evaluate((v: HTMLVideoElement) => v.videoWidth)).toBeGreaterThan(0)
    expect(addresses.length).toBeGreaterThan(0)
    expect(addresses.every((address) => address === publicIp)).toBe(true)
  })
}
