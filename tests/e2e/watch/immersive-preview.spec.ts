import { expect, test } from "@playwright/test"
import { axeViolations } from "../support/a11y"
const TITLE =
  "/?demo=1#/s/00000000-0000-4000-a000-000000000001/watch/00000000-0000-4000-a000-000000000010"

test("first tap immerses the viewer with episode identity and next controls @mobile", async ({
  page,
}, info) => {
  await page.goto(TITLE)
  await expect(page.locator(".fan-trigger")).toHaveAccessibleName(/Continue S1 E3/)
  const action = page.locator(".fan-trigger")
  if (info.project.name === "desktop") await action.click()
  else await action.tap()
  const player = page.getByRole("dialog", { name: "Watching Ted Lasso", exact: true })
  await expect(player).toBeVisible()
  await expect(player).toContainText("S1 E3")
  await expect(player).toContainText("Sample preview")
  await expect(player.getByRole("button", { name: "Next episode", exact: true })).toBeVisible()
  await expect(player.getByRole("combobox", { name: "Subtitles", exact: true })).toBeHidden()
  // Native media controls can animate continuously; scan the active modal directly.
  expect(await axeViolations(page, '[role="dialog"]')).toEqual([])
  await page.clock.install()
  const video = player.locator("video")
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThan(1)
  await video.evaluate(async (v: HTMLVideoElement) => {
    v.currentTime = 4
    await v.play()
  })
  await expect(player.getByRole("button", { name: /Skip intro/ })).toBeVisible()
  await page.clock.runFor(3000)
  expect(await video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThanOrEqual(8)
  await player.getByRole("button", { name: "Next episode", exact: true }).click()
  await expect(player).toContainText("S1 E4")
  await expect(player.locator("video")).toBeVisible()
  expect(await video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeLessThan(5)
  await video.evaluate(async (v: HTMLVideoElement) => {
    v.currentTime = 29.8
    await v.play()
  })
  await expect(player.getByRole("button", { name: "Play now", exact: true })).toBeVisible()
  await page.clock.runFor(10_000)
  await expect(player).toContainText("S1 E5")
  await page.keyboard.press("Escape")
  await expect(player).toBeHidden()
  await expect(page.getByRole("heading", { name: "Episodes", exact: true })).toBeVisible()
})
