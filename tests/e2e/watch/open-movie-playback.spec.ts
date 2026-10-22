import { expect, test } from "@playwright/test"
import { playInApp, seedFilm } from "../support/live-film"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()
// Plays a real film from video.blender.org, so it needs the internet: E2E_LIVE=1 opts in.
test.skip(!process.env.E2E_LIVE, "live playback; set E2E_LIVE=1 to run it")

const BIG_BUCK_BUNNY = 10378

test("an openly licensed film plays from the PeerTube adapter in the app's own player", async ({
  page,
}) => {
  test.setTimeout(120_000)
  const violations: string[] = []
  page.on("console", (m) => /Content.Security.Policy/i.test(m.text()) && violations.push(m.text()))
  await signIn(page, await createUser("viewer"))
  const spaceId = await createSpace(page, "Open movies")
  const itemId = await seedFilm(spaceId, "Big Buck Bunny", BIG_BUCK_BUNNY)

  await page.goto(`./#/s/${spaceId}/watch/${itemId}`)
  const playing = await playInApp(page)
  expect(new URL(playing.src).origin).toBe("https://video.blender.org")
  expect(playing.paused).toBe(false)
  expect(playing.width).toBeGreaterThan(0)
  await page.screenshot({ path: "test-results/open-movie-playing.png" })
  expect(violations).toEqual([])
})
