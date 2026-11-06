import { titleActivity } from "../support/title"
import { expect, test } from "@playwright/test"
import { addTitle } from "../support/fixtures"
import { expectFocusTrap, tabTo } from "../support/keyboard"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()

// #20 acceptance: the main flows work from the keyboard alone.
test("sign in, create a space and capture an idea by keyboard", async ({ page }) => {
  test.setTimeout(120_000)
  const user = await createUser("keys")
  await page.goto("./#/auth/sign-in")
  await tabTo(page, page.getByLabel("Email"))
  await page.keyboard.type(user.email)
  await tabTo(page, page.getByLabel("Password"))
  await page.keyboard.type(user.password)
  await page.keyboard.press("Enter")
  await expect(page.getByRole("heading", { name: /space for your people/ })).toBeVisible()

  await page.goto("./#/spaces/new")
  await tabTo(page, page.getByLabel("Space name"))
  await page.keyboard.type("Keyboard space")
  await page.keyboard.press("Enter")
  await page.waitForURL(/#\/s\/[0-9a-f-]{36}\/home/)

  await tabTo(page, page.getByRole("button", { name: "Capture an idea from anywhere" }))
  await page.keyboard.press("Enter")
  await expect(page.getByLabel("Idea", { exact: true })).toBeFocused()
  await page.keyboard.type("Keyboard karaoke")
  await tabTo(page, page.getByRole("button", { name: "Save idea" }))
  await page.keyboard.press("Enter")
  await expect(page.getByText("Idea saved")).toBeVisible()
})

test("the skip link moves focus to the main content", async ({ page }) => {
  await signIn(page, await createUser("skip"))
  const spaceId = await createSpace(page, "Skip space")
  await page.goto(`./#/s/${spaceId}/home`)
  await page.reload()
  // Tab only once the app has rendered, as a person would; a keypress during boot goes nowhere.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator("main")).toBeFocused()
  await expect(page).toHaveURL(new RegExp(`#/s/${spaceId}/home`))
})

test("dialogs trap focus, close on Escape and return focus", async ({ page }) => {
  test.setTimeout(120_000)
  await signIn(page, await createUser("trap"))
  const spaceId = await createSpace(page, "Trap space")
  await addTitle(page, spaceId, "Mononoke")
  const dialog = (name: string) => page.getByRole("dialog", { name })

  await expectFocusTrap(
    page,
    page.getByRole("button", { name: "About this title", exact: true }).first(),
    dialog("About this title"),
  )
  await titleActivity(page)
  await expectFocusTrap(
    page,
    page.getByRole("button", { name: "Adjust my place" }),
    dialog("Adjust my place"),
  )
  await page.goto(`./#/s/${spaceId}/watch`)
  await page.getByRole("button", { name: "Add a title", exact: true }).click()
  await expectFocusTrap(
    page,
    page.getByRole("button", { name: "Enter a title manually" }),
    dialog("Add a title manually"),
    page.getByRole("button", { name: "Open search", exact: true }),
  )
  await page.keyboard.press("Escape")
  const more = page.getByRole("button", { name: "Common Ground menu", exact: true })
  await more.click()
  await page.getByRole("button", { name: "Notifications", exact: true }).click()
  await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(more).toBeFocused()
})
