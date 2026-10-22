import { expect, test } from "@playwright/test"
import { playInApp, seedFilm } from "../support/live-film"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()
// Plays through a real CinePro Core, so it needs one and the internet. E2E_LIVE=1 opts in, and
// the Playwright build must name the Core (docs/runbooks/cinepro.md).
const ORIGIN = process.env.VITE_CINEPRO_CORE_ORIGIN
test.skip(!process.env.E2E_LIVE || !ORIGIN, "live CinePro playback; set E2E_LIVE=1 and the origin")

const THE_MATRIX = 603

test("a film plays through the CinePro Core adapter in the app's own player", async ({ page }) => {
  test.setTimeout(180_000)
  const core = new URL(ORIGIN!).origin
  const violations: string[] = []
  const asked: string[] = []
  page.on("console", (m) => /Content.Security.Policy/i.test(m.text()) && violations.push(m.text()))
  page.on("request", (r) => r.url().startsWith(core) && asked.push(new URL(r.url()).pathname))
  await signIn(page, await createUser("viewer"))
  const spaceId = await createSpace(page, "CinePro")
  const itemId = await seedFilm(spaceId, "The Matrix", THE_MATRIX)

  await page.goto(`./#/s/${spaceId}/watch/${itemId}`)
  const playing = await playInApp(page, 90_000)
  // HLS and DASH play through shaka-player from a blob: URL, so the proof is what was fetched.
  expect(asked).toContain(`/v1/movies/${THE_MATRIX}`)
  expect(asked).toContain("/v1/proxy")
  expect(playing.paused).toBe(false)
  expect(playing.width).toBeGreaterThan(0)
  await page.screenshot({ path: "test-results/cinepro-playing.png" })
  expect(violations).toEqual([])
})
