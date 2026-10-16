import { expect, test } from "@playwright/test"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()

// #28: on a phone the notifications open as a sheet covering the whole screen.
test("notifications fill a phone screen and Escape returns to the bell @mobile", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "mobile", "phones only")
  await signIn(page, await createUser("phone"))
  await createSpace(page, "Phone space")
  const bell = page.getByRole("button", { name: /^Notifications/ })
  await bell.click()

  const sheet = page.getByRole("dialog", { name: "Notifications" })
  await expect(sheet).toBeVisible()
  await page.waitForFunction(() => document.getAnimations().length === 0)
  const box = (await sheet.boundingBox())!
  const size = page.viewportSize()!
  expect(box).toEqual({ x: 0, y: 0, width: size.width, height: size.height })
  await expect(sheet.getByText("You are all caught up.")).toBeVisible()
  await expect(sheet.getByRole("button", { name: "Close" })).toHaveCount(1)

  await page.keyboard.press("Escape")
  await expect(sheet).toBeHidden()
  await expect(bell).toBeFocused()
})
