import { expect, test } from "@playwright/test"
import { openFixtureFilm } from "../support/fixture-film"
import { MediaServer } from "../support/media-server"
import { requireStack } from "../support/stack"

requireStack()
const media = new MediaServer()
test.beforeAll(() => media.start())
test.afterAll(() => media.stop())

for (const [kind, path] of [
  ["file", "/party.mp4"],
  ["hls", "/audio/master.m3u8"],
] as const) {
  test(`${kind}: local subtitles load once and never leave the device`, async ({ page }) => {
    const violations: string[] = []
    page.on(
      "console",
      (m) => /Content.Security.Policy/i.test(m.text()) && violations.push(m.text()),
    )
    await openFixtureFilm(page, media, [{ path, kind }])
    const video = page.locator("video")
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
      .toBeGreaterThan(1)
    await page.locator("summary", { hasText: "Audio and subtitles" }).click()
    if (kind === "hls") {
      const audio = page.getByLabel("Audio language")
      await expect(audio.locator("option:checked")).toContainText("English")
      const spanish = await audio
        .locator("option")
        .filter({ hasText: "Spanish" })
        .getAttribute("value")
      await audio.selectOption(spanish)
      await expect(audio.locator("option:checked")).toContainText("Spanish")
    }
    const file = {
      name: "my-subtitles.srt",
      mimeType: "application/x-subrip",
      buffer: Buffer.from("1\n00:00:00,000 --> 00:00:05,000\nLocal captions\n"),
    }
    const input = page.getByLabel("Load subtitle file")
    await input.setInputFiles(file)
    await expect(
      page.getByRole("combobox", { name: "Subtitles", exact: true }).locator("option:checked"),
    ).toContainText(file.name)
    const count = await page
      .getByRole("combobox", { name: "Subtitles", exact: true })
      .locator("option")
      .count()
    await input.setInputFiles(file)
    await expect(
      page.getByRole("combobox", { name: "Subtitles", exact: true }).locator("option"),
    ).toHaveCount(count)
    await expect
      .poll(() =>
        video.evaluate((v: HTMLVideoElement) =>
          Array.from(v.textTracks).some((t) => t.mode === "showing" && (t.cues?.length ?? 0) > 0),
        ),
      )
      .toBe(true)
    expect(media.requests.some((p) => /srt|vtt/.test(p))).toBe(false)
    expect(violations).toEqual([])
  })
}
