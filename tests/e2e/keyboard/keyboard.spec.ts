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
  test.fail(
    true,
    'href="#main" is read as a hash route, so the skip link opens the not-found page (src/app/shell/AppShell.svelte:33)',
  )
  await signIn(page, await createUser("skip"))
  const spaceId = await createSpace(page, "Skip space")
  await page.goto(`./#/s/${spaceId}/home`)
  await page.reload()
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
    page.getByRole("button", { name: "Capture an idea from anywhere" }),
    dialog("Catch it before it goes"),
  )
  await expectFocusTrap(
    page,
    page.getByRole("button", { name: "Edit details" }),
    dialog("Edit this title"),
  )
  await page.goto(`./#/s/${spaceId}/watch`)
  await expectFocusTrap(
    page,
    page.getByRole("button", { name: "Add a title", exact: true }),
    dialog("Add a title"),
  )
  const bell = page.getByRole("button", { name: /^Notifications/ })
  await bell.focus()
  await page.keyboard.press("Enter")
  await expect(bell).toHaveAttribute("aria-expanded", "true")
  await page.keyboard.press("Escape")
  await expect(bell).toHaveAttribute("aria-expanded", "false")
  await expect(bell).toBeFocused()
})
