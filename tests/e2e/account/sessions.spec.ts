import { expect, test, type Page } from "@playwright/test"
import { signedInClient } from "../support/clients"
import { signIn } from "../support/session"
import { createUser, type TestUser } from "../support/stack"

/** Another device holding the same account, and this page on the Account screen. */
async function twoDevices(page: Page, handle: string) {
  const user: TestUser = await createUser(handle)
  const otherDevice = await signedInClient(user)
  await signIn(page, user)
  await page.goto("./#/account")
  return { user, otherDevice }
}

// The auth server does this itself; the spec guards that it keeps doing so.
test("changing the password signs out the other devices, not this one", async ({ page }) => {
  const { user, otherDevice } = await twoDevices(page, "ana")
  await page.getByLabel("Current password").fill(user.password)
  await page.getByLabel("New password", { exact: true }).fill("a brand new password")
  await page.getByRole("button", { name: "Change password" }).click()
  await expect(page.getByText("Password changed")).toBeVisible()

  expect((await otherDevice.auth.refreshSession()).error).not.toBeNull()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Account and data" })).toBeVisible()
})

test("sign out everywhere ends this device and the others", async ({ page }) => {
  const { otherDevice } = await twoDevices(page, "ben")
  await page.getByRole("button", { name: "Sign out everywhere" }).click()
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
  expect((await otherDevice.auth.refreshSession()).error).not.toBeNull()
})
