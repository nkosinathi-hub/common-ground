import type { Page } from "@playwright/test"

/** Home uses its central composer below 768 px and an inline card action above it. */
export const noteAction = (page: Page) =>
  page.viewportSize()!.width < 768
    ? page.locator(".fan-trigger")
    : page.getByRole("button", { name: "Write a note", exact: true })
