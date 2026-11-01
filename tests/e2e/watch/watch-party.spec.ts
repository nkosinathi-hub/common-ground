import { expect, test } from "@playwright/test"
import { rpc, signedInClient } from "../support/clients"
import { inviteMember } from "../support/fixtures"
import { seedFilm } from "../support/live-film"
import { MediaServer } from "../support/media-server"
import { createSpace, signIn } from "../support/session"
import { admin, createUser, requireStack } from "../support/stack"

requireStack()
const media = new MediaServer()
test.beforeAll(() => media.start())
test.afterAll(() => media.stop())

for (const [kind, path] of [
  ["file", "/party.mp4"],
  ["hls", "/party-hls/index.m3u8"],
] as const) {
  test(`${kind}: ready members share native play, pause, forward and reverse seeks and history`, async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000)
    media.catalog = [{ path, kind }]
    const owner = await createUser("party-host")
    await signIn(page, owner)
    const space = await createSpace(page, "Synchronized playback")
    const guest = await inviteMember(page, browser, space, await createUser("party-guest"))
    const item = await seedFilm(space, "Party fixture", 603)
    const client = await signedInClient(owner)
    const party = await rpc<string>(client, "start_party", {
      item,
      src: "jellyfin",
      s1: null,
      e1: null,
      s2: null,
      e2: null,
      counts: null,
    })
    const errors: string[] = []
    for (const p of [page, guest]) p.on("pageerror", (error) => errors.push(error.message))
    await Promise.all([page, guest].map((p) => p.goto(`./#/s/${space}/party/${party}`)))
    const videos = [page.locator("video"), guest.locator("video")]
    for (const v of videos) {
      await expect(v).toBeVisible()
      await expect.poll(() => v.evaluate((e: HTMLVideoElement) => e.readyState)).toBeGreaterThan(1)
    }
    for (const p of [page, guest]) await p.getByRole("button", { name: "I am ready" }).click()
    await expect(page.getByText("Ready", { exact: true })).toHaveCount(2)
    await videos[1]!.evaluate((v: HTMLVideoElement) => v.play())
    for (const v of videos)
      await expect.poll(() => v.evaluate((e: HTMLVideoElement) => e.currentTime)).toBeGreaterThan(1)
    await videos[0]!.evaluate((v: HTMLVideoElement) => v.pause())
    for (const v of videos)
      await expect.poll(() => v.evaluate((e: HTMLVideoElement) => e.paused)).toBe(true)
    await videos[1]!.evaluate((v: HTMLVideoElement) => {
      v.currentTime = 30
    })
    for (const v of videos)
      await expect.poll(() => v.evaluate((e: HTMLVideoElement) => e.currentTime)).toBeCloseTo(30, 0)
    await videos[0]!.evaluate((v: HTMLVideoElement) => {
      v.currentTime = 10
    })
    for (const v of videos)
      await expect.poll(() => v.evaluate((e: HTMLVideoElement) => e.currentTime)).toBeCloseTo(10, 0)
    await page.getByRole("button", { name: "Play for everyone" }).click()
    for (const v of videos)
      await expect.poll(() => v.evaluate((e: HTMLVideoElement) => e.paused)).toBe(false)
    await guest.getByRole("button", { name: "Forward 10 seconds" }).click()
    await expect
      .poll(async () =>
        Math.abs(
          (await videos[0]!.evaluate((v: HTMLVideoElement) => v.currentTime)) -
            (await videos[1]!.evaluate((v: HTMLVideoElement) => v.currentTime)),
        ),
      )
      .toBeLessThan(1)
    await guest.getByRole("button", { name: "We finished" }).click()
    await expect
      .poll(async () => {
        const { data, error } = await admin()
          .from("episode_watches")
          .select("user_id")
          .eq("watch_item_id", item)
          .eq("source", "party")
        if (error) throw error
        return new Set(data.map((r: { user_id: string }) => r.user_id)).size
      })
      .toBe(2)
    expect(errors).toEqual([])
    await guest.context().close()
  })
}
