import { expect, test } from "@playwright/test"
import { settled } from "../support/a11y"
import { createSpace, signIn } from "../support/session"
import { createUser } from "../support/stack"

test("every primary screen renders without runtime errors", async ({ page }) => {
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
  const ana = await createUser("smoke")
  await signIn(page, ana)
  const spaceId = await createSpace(page, "Smoke space")

  await expect(page.getByRole("heading", { level: 1 })).toContainText("smoke")
  for (const path of ["watch", "ideas", "settings", "home"]) {
    await page.goto(`./#/s/${spaceId}/${path}`)
    await settled(page)
  }
  await page.goto("./#/account")
  await page.goto("./#/privacy")
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible()
  expect(errors).toEqual([])
})
