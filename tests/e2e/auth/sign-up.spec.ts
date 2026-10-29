import { expect, test } from "@playwright/test"
import { latestLink } from "../support/mailpit"
import { requireStack, uniqueEmail } from "../support/stack"

requireStack()

test("sign up, verify by email, sign out and back in", async ({ page }) => {
  const email = uniqueEmail("newbie")
  await page.goto("./#/auth/sign-up")
  await page.getByLabel("Your name").fill("Newbie")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill("short")
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByText("Use at least 10 characters")).toBeVisible()
  await expect(page.getByLabel("Email")).toHaveValue(email)

  await page.getByLabel("Password").fill("a long enough password")
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible()

  await page.goto(await latestLink(email))
  await expect(page.getByRole("heading", { name: "Make a space for your people" })).toBeVisible()
  expect(page.url()).not.toContain("code=")

  await page.getByRole("button", { name: "Create space" }).click()
  await page.waitForURL(/#\/s\/.+\/home/)
  const appKeys = () =>
    page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("common-ground:")))
  expect(await appKeys()).toContain("common-ground:active-space")
  await page.getByRole("button", { name: "Account" }).first().click()
  await page.getByRole("menuitem", { name: "Sign out" }).click()
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
  expect(await appKeys()).toEqual([])

  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill("a long enough password")
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL(/#\/s\/.+\/home/)
})

test("private routes redirect to sign in when signed out", async ({ page }) => {
  await page.goto("./#/s/8f9c2d1e-0b5a-4c3f-9e7d-112233445566/watch")
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
})

test("an expired or reused link offers a fresh one", async ({ page }) => {
  await page.goto("./?error=access_denied&error_code=otp_expired#/")
  await expect(page.getByRole("heading", { name: "This link has expired" })).toBeVisible()
  expect(page.url()).not.toContain("error=")
})
