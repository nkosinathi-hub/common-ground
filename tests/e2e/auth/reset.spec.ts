import { expect, test } from "@playwright/test"
import { latestLink } from "../support/mailpit"
import { createUser } from "../support/stack"

test("reset a forgotten password through the emailed link", async ({ page }) => {
  const user = await createUser("forgetful")
  await page.goto("./#/auth/reset")
  await page.getByLabel("Email").fill(user.email)
  await page.getByRole("button", { name: "Send reset link" }).click()
  await expect(page.getByRole("status")).toContainText("reset link is on its way")

  await page.goto(await latestLink(user.email))
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible()
  await page.getByLabel("New password").fill("a brand new password")
  await page.getByRole("button", { name: "Save password" }).click()
  await expect(page.getByRole("heading", { name: "Make a space for your people" })).toBeVisible()
})

test("wrong password shows a generic error and keeps the email", async ({ page }) => {
  const user = await createUser("typo")
  await page.goto("./#/auth/sign-in")
  await page.getByLabel("Email").fill(user.email)
  await page.getByLabel("Password").fill("not the password")
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page.getByRole("alert")).toContainText("Email or password is incorrect")
  await expect(page.getByLabel("Email")).toHaveValue(user.email)
})
