import { expect, test } from "@playwright/test"
import { createSpace, signIn } from "../support/session"
import { createUser } from "../support/stack"

// #14 acceptance: notes, research links and hypotheses persist and reload; non-web links are refused.
test("research survives a reload and refuses non-web links", async ({ page }) => {
  test.setTimeout(180_000)
  const ana = await createUser("researcher")
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Research test")
  await page.goto(`./#/s/${spaceId}/ideas`)
  await page.getByLabel("Idea title").fill("Zine")
  await page.getByRole("button", { name: "Capture", exact: true }).click()
  await page.getByRole("link", { name: /Zine/ }).first().click()
  await page.waitForURL(/\/ideas\/[0-9a-f-]{36}\/overview/)
  await page.goto(page.url().replace(/\/overview$/, "/research"))

  await page.getByLabel("New note").fill("Ask the print shop about risograph")
  await page.getByRole("button", { name: "Add note" }).click()
  await expect(page.getByTestId("note")).toContainText("risograph")

  await page.getByLabel("Link URL").fill("ftp://files.example.com/zine.pdf")
  await page.getByLabel("Link title").fill("Old archive")
  await page.getByRole("button", { name: "Add link" }).click()
  await expect(page.getByRole("alert")).toContainText("http:// or https://")
  await page.getByLabel("Link URL").fill("https://example.com/riso-guide")
  await page.getByRole("button", { name: "Add link" }).click()
  await expect(page.getByTestId("research-link")).toContainText("Old archive")

  await page.getByLabel("New hypothesis").fill("Twenty copies sell out in a week")
  await page.getByRole("button", { name: "Add", exact: true }).click()
  const saved = page.waitForResponse(
    (r) => r.url().includes("/hypotheses") && r.request().method() === "PATCH",
  )
  await page.getByTestId("hypothesis").getByLabel("Status").selectOption("validated")
  expect((await saved).ok()).toBe(true)

  await page.reload()
  await expect(page.getByTestId("note")).toContainText("risograph")
  await expect(page.getByTestId("research-link")).toHaveCount(1)
  await expect(page.getByTestId("research-link").getByRole("link")).toHaveAttribute(
    "href",
    "https://example.com/riso-guide",
  )
  await expect(page.getByTestId("hypothesis").getByLabel("Status")).toHaveValue("validated")
})
