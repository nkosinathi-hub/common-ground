import { expect, test, type Locator, type Page } from "@playwright/test"
import { axeViolations } from "../support/a11y"
import { requireStack } from "../support/stack"
import { closeDialog, next, startSharing, threeMembers, waiting } from "./hard-talk"

requireStack()

let ana: Page
let ben: Page

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000)
  const setup = await threeMembers(browser, "Hard talk a11y")
  ;[ana, ben] = setup.pages
  await setup.pages[2].context().close()
})

test.afterAll(async () => {
  for (const page of [ana, ben]) await page?.context().close()
})

/** Axe on the whole page once motion settles, in the given colour scheme. */
async function scan(page: Page): Promise<void> {
  await page.waitForFunction(() => document.getAnimations().length === 0)
  expect(await axeViolations(page)).toEqual([])
}

/** On phones a dialog is a bottom sheet. */
async function sheetOnPhones(page: Page, dialog: Locator): Promise<void> {
  const viewport = page.viewportSize()
  if (!viewport || viewport.width >= 640) return
  const box = await dialog.boundingBox()
  expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(viewport.height)
}

for (const scheme of ["light", "dark"] as const) {
  test(`the composer and the reader pass axe in ${scheme} mode @a11y`, async () => {
    test.setTimeout(150_000)
    for (const page of [ana, ben]) {
      await page.emulateMedia({ colorScheme: scheme })
      await page.reload()
      if (scheme === "dark") await expect(page.locator("html")).toHaveClass(/dark/)
    }
    const dialog = await startSharing(ana, "ben")
    await next(dialog)
    await dialog.getByRole("button", { name: "hurt", exact: true }).click()
    await expect(dialog.getByRole("button", { name: "Remove hurt" })).toBeVisible()
    await expect(dialog.getByRole("status")).toHaveText(/saved/i)
    await sheetOnPhones(ana, dialog)
    await scan(ana)
    await next(dialog)
    await dialog.getByRole("button", { name: "Send to ben" }).click()
    await expect(dialog).toBeHidden()

    await expect(waiting(ben)).toBeVisible()
    await scan(ben)
    await waiting(ben).getByRole("button", { name: "Open when you're ready" }).click()
    const reader = ben.getByRole("dialog", { name: "From ana" })
    await reader.getByRole("button", { name: /^I need a little time/ }).click()
    await expect(reader.getByText("Want a gentle reminder?")).toBeVisible()
    await sheetOnPhones(ben, reader)
    await scan(ben)
    await reader.getByRole("button", { name: "Tomorrow" }).click()
    await closeDialog(ben, reader)
  })
}
