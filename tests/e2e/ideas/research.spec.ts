import { expect, test } from "@playwright/test"
import { captureIdea, openIdeaTab } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { createUser } from "../support/stack"

// #14 acceptance: notes, research links and hypotheses persist and reload; non-web links are refused.
test("research survives a reload and refuses non-web links", async ({ page }) => {
  test.setTimeout(180_000)
  const ana = await createUser("researcher")
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Research test")
  const ideaId = await captureIdea(page, spaceId, "Zine")
  await openIdeaTab(page, spaceId, ideaId, "research")

  await page.getByLabel("Add a research note").fill("Ask the print shop about risograph")
  await page.getByRole("button", { name: "Add note" }).click()
  await expect(page.getByTestId("note")).toContainText("risograph")

  await page.getByLabel("URL", { exact: true }).fill("ftp://files.example.com/zine.pdf")
  await page.getByLabel("Title", { exact: true }).fill("Old archive")
  await page.getByRole("button", { name: "Add link" }).click()
  await expect(page.getByText(/http:\/\/ or https:\/\//)).toBeVisible()
  await page.getByLabel("URL", { exact: true }).fill("https://example.com/riso-guide")
  await page.getByRole("button", { name: "Add link" }).click()
  await expect(page.getByTestId("research-link")).toContainText("Old archive")

  await page.getByLabel("New hypothesis").fill("Twenty copies sell out in a week")
  await page.getByRole("button", { name: "Add", exact: true }).click()
  const saved = page.waitForResponse(
    (r) => r.url().includes("/hypotheses") && r.request().method() === "PATCH",
  )
  await page
    .getByTestId("hypothesis")
    .getByRole("radio", { name: "Validated", exact: true })
    .click()
  expect((await saved).ok()).toBe(true)

  await page.reload()
  await expect(page.getByTestId("note")).toContainText("risograph")
  await expect(page.getByTestId("research-link")).toHaveCount(1)
  await expect(page.getByTestId("research-link").getByRole("link")).toHaveAttribute(
    "href",
    "https://example.com/riso-guide",
  )
  await expect(
    page.getByTestId("hypothesis").getByRole("radio", { name: "Validated", exact: true }),
  ).toBeChecked()
})
