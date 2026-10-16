import { expect, test, type Browser, type BrowserContextOptions, type Page } from "@playwright/test"
import type { TestUser } from "./stack"

export async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.goto("./#/auth/sign-in")
  await page.getByLabel("Email").fill(user.email)
  await page.getByLabel("Password").fill(user.password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(
    page.getByRole("heading", { name: /space for your people|Home|Good/ }).first(),
  ).toBeVisible({ timeout: 30_000 })
}

/** Creates a space through the UI and returns its id from the URL. */
export async function createSpace(page: Page, name: string): Promise<string> {
  await page.goto("./#/spaces/new")
  await page.getByLabel("Space name").fill(name)
  await page.getByRole("button", { name: "Create space" }).click()
  await page.waitForURL(/#\/s\/[0-9a-f-]{36}\/home/)
  return /#\/s\/([0-9a-f-]{36})/.exec(page.url())![1]!
}

/** The time zone and locale a page runs in, so another member's browser can match them. */
export async function zoneOf(page: Page): Promise<BrowserContextOptions> {
  return page.evaluate(() => ({
    timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
  }))
}

/**
 * A second, isolated browser for another member on the project's device. `options` adds a time
 * zone and locale (see zoneOf); `before` runs on the new page before it signs in.
 */
export async function secondMember(
  browser: Browser,
  user: TestUser,
  options: BrowserContextOptions = {},
  before?: (page: Page) => void,
): Promise<Page> {
  const page = await projectPage(browser, options)
  before?.(page)
  await signIn(page, user)
  return page
}

/** A page in a new context that keeps the current project's device (viewport, touch, mobile). */
export async function projectPage(browser: Browser, extra: BrowserContextOptions = {}) {
  const { viewport, hasTouch, isMobile, userAgent, deviceScaleFactor } = test.info().project.use
  const context = await browser.newContext({
    viewport,
    hasTouch,
    isMobile,
    userAgent,
    deviceScaleFactor,
    ...extra,
  })
  return context.newPage()
}
