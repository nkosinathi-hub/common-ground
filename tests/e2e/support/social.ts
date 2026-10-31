import { expect, type Page } from "@playwright/test"

/** On a title page, recommends it to one member with a note. */
export async function recommend(page: Page, to: string, note: string): Promise<void> {
  await page.getByRole("button", { name: "Recommend" }).click()
  const dialog = page.getByRole("dialog", { name: "Recommend a title" })
  await dialog.getByRole("button", { name: to, exact: true }).click()
  await dialog.getByLabel("Note (optional)").fill(note)
  await dialog.getByRole("button", { name: "Send" }).click()
  // The dialog closes only once the send succeeds; an earlier toast may still be showing.
  await expect(dialog).toBeHidden()
  await expect(page.getByText(`Recommended to ${to}`).first()).toBeVisible()
}

/** Posts a plain comment in the thread on the current page. */
export async function comment(page: Page, body: string): Promise<void> {
  await page.getByLabel("Add a comment").fill(body)
  await page.getByRole("button", { name: "Post", exact: true }).click()
  await expect(page.getByText(body)).toBeVisible()
}

/** Opens the notifications popover and expects one notification by its text. */
export async function expectNotification(page: Page, text: RegExp): Promise<void> {
  await page.getByRole("button", { name: /^Notifications, \d+ unread$/ }).click()
  await expect(page.getByRole("link", { name: text })).toBeVisible()
  await page.keyboard.press("Escape")
}

/** A one-pixel PNG, enough for the attachments pipeline to sniff and preview. */
export const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
  "base64",
)
