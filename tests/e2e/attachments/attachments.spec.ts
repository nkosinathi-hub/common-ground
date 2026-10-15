import { expect, test } from "@playwright/test"
import { edgeFunctionBlocker } from "../support/clients"
import { captureIdea, openIdeaTab } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { PIXEL_PNG } from "../support/social"
import { createUser, requireStack } from "../support/stack"

requireStack()

const MISMATCH = "This file's contents do not match its type, so it was not attached"

// #17 acceptance: a real image uploads, opens through a signed URL and deletes; a file whose
// bytes are not what its name claims is refused on the server.
test("an image attaches, opens and deletes; a disguised file is refused", async ({
  page,
  baseURL,
}) => {
  const blocker = await edgeFunctionBlocker("attachments", new URL(baseURL!).origin)
  test.skip(blocker !== null, blocker ?? "")
  test.setTimeout(180_000)
  await signIn(page, await createUser("filer"))
  const spaceId = await createSpace(page, "Files test")
  const ideaId = await captureIdea(page, spaceId, "Mood board")
  await openIdeaTab(page, spaceId, ideaId, "research")
  const panel = page.getByRole("region", { name: "Attachments" })
  const picker = page.getByLabel("Choose a file to attach")

  await picker.setInputFiles({ name: "pixel.png", mimeType: "image/png", buffer: PIXEL_PNG })
  const preview = panel.getByRole("img", { name: "pixel.png" })
  await expect(preview).toBeVisible()
  await expect
    .poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
  const signed = (await preview.getAttribute("src"))!
  expect(signed).toContain("/storage/v1/object/sign/")
  const fetched = await page.request.get(signed)
  expect(fetched.status()).toBe(200)
  expect(Buffer.compare(await fetched.body(), PIXEL_PNG)).toBe(0)

  const text = Buffer.from("this is plain text, not a PNG")
  await picker.setInputFiles({ name: "fake.png", mimeType: "image/png", buffer: text })
  await expect(panel.getByRole("alert")).toContainText(MISMATCH)
  await page.reload()
  await expect(preview).toBeVisible()
  await expect(panel.getByText("fake.png")).toHaveCount(0)

  await panel.getByRole("button", { name: "Delete pixel.png" }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
  await expect(page.getByText("pixel.png was deleted")).toBeVisible()
  await expect(preview).toHaveCount(0)
  await page.reload()
  await expect(panel).toBeVisible()
  await expect(panel.getByText("pixel.png")).toHaveCount(0)
})
