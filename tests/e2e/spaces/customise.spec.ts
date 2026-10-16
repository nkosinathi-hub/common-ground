import { expect, test } from "@playwright/test"
import { expectAccessible } from "../support/a11y"
import { inviteMember } from "../support/fixtures"
import { createSpace, projectPage, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"
import { expectReadablePrimary, PICTURE, rootColour, saveSettings } from "./look"

requireStack()

const SIGNED = /\/storage\/v1\/object\/sign\/space-media\//

test("the owner customises a space and a member sees the same look", async ({ page, browser }) => {
  test.setTimeout(180_000)
  const [ana, ben] = await Promise.all([createUser("ana"), createUser("ben")])
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Our corner")
  await page.goto(`./#/s/${spaceId}/settings`)
  const before = await rootColour(page, "--primary")

  await page.getByRole("radio", { name: "Ocean" }).click()
  await page.getByLabel("Accent hex code").fill("#ffff00")
  await expect(page.getByText(/Adjusted for readability/)).toBeVisible()
  await saveSettings(page, "Save look")
  await expect(page.locator("html")).toHaveAttribute("data-space-theme", "ocean")
  const primary = await expectReadablePrimary(page)
  expect(primary).not.toBe(before)

  await page.getByLabel("Tagline").fill("Sunday dinners and slow films")
  await saveSettings(page, "Save")
  const activity = page.getByRole("switch", { name: "Show Recent activity" })
  const shownColour = await activity.evaluate((el) => getComputedStyle(el).backgroundColor)
  await activity.click()
  await expect(activity).toHaveAttribute("aria-checked", "false")
  // The switch must look different off than on, not only report it to assistive tech.
  await expect(activity).not.toHaveCSS("background-color", shownColour)
  await saveSettings(page, "Save layout")

  await page.getByLabel("Choose a picture").setInputFiles(PICTURE)
  await expect(page.getByText("Picture saved")).toBeVisible()
  const switcher = page.getByRole("button", { name: "Switch space" }).first()
  await expect(switcher.locator("img")).toHaveAttribute("src", SIGNED)

  await page.goto(`./#/s/${spaceId}/home`)
  await page.reload()
  await expect(page.getByTestId("space-banner")).toContainText("Sunday dinners and slow films")
  await expect(page.getByText("Recently in Our corner")).toHaveCount(0)
  await expect(page.getByText("Continue watching")).toBeVisible()

  const benPage = await inviteMember(page, browser, spaceId, ben)
  await expect(benPage.getByTestId("space-banner")).toContainText("Sunday dinners")
  await expect(benPage.locator("html")).toHaveAttribute("data-space-theme", "ocean")
  expect(await rootColour(benPage, "--primary")).toBe(primary)
  const benSwitcher = benPage.getByRole("button", { name: "Switch space" }).first()
  await expect(benSwitcher.locator("img")).toHaveAttribute("src", SIGNED)
  await benPage.goto("./#/account")
  await expect(benPage.locator("html")).not.toHaveAttribute("data-space-theme", /.*/)
  expect(await benPage.evaluate(() => document.documentElement.style.cssText)).not.toContain(
    "--primary",
  )
  await benPage.context().close()
})

test("a customised space passes axe in dark mode @a11y", async ({ browser }) => {
  test.setTimeout(180_000)
  const page = await projectPage(browser, { colorScheme: "dark" })
  await signIn(page, await createUser("dusk"))
  const spaceId = await createSpace(page, "Night owls")
  await page.goto(`./#/s/${spaceId}/settings`)
  await page.getByRole("radio", { name: "Berry" }).click()
  await page.getByLabel("Accent hex code").fill("#101010")
  await saveSettings(page, "Save look")
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expectReadablePrimary(page)
  for (const path of ["home", "settings"]) {
    await page.goto(`./#/s/${spaceId}/${path}`)
    await expectAccessible(page)
  }
  await page.goto("./#/account")
  await expectAccessible(page)
  await page.context().close()
})
