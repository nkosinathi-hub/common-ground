import { expect, test } from "@playwright/test"
import { edgeFunctionBlocker } from "../support/clients"
import { addTitle, captureIdea, inviteMember, openIdeaTab } from "../support/fixtures"
import { createSpace, signIn } from "../support/session"
import { comment, expectNotification, PIXEL_PNG, recommend } from "../support/social"
import { createUser, requireStack } from "../support/stack"
import { addTask, setTaskField } from "../support/tasks"
import { daysFromNow } from "../support/dates"

requireStack()

// The v0.1 release scenario, condensed: two people share one space end to end.
test("two members share titles, ideas, a third member, talk and tasks", async ({
  page,
  browser,
}) => {
  test.setTimeout(300_000)
  const [ana, ben, cal] = await Promise.all(["ana", "ben", "cal"].map(createUser))
  await signIn(page, ana!)
  const spaceId = await createSpace(page, "Release night")
  const benPage = await inviteMember(page, browser, spaceId, ben!)

  const itemId = await addTitle(page, spaceId, "Spirited Away")
  const ideaId = await captureIdea(page, spaceId, "Studio Ghibli marathon")
  await benPage.goto(`./#/s/${spaceId}/watch`)
  await expect(benPage.getByRole("link", { name: /Spirited Away/ }).first()).toBeVisible()
  await benPage.goto(`./#/s/${spaceId}/ideas`)
  await expect(benPage.getByRole("link", { name: /Studio Ghibli marathon/ }).first()).toBeVisible()

  const calPage = await inviteMember(page, browser, spaceId, cal!)
  await benPage.goto(`./#/s/${spaceId}/settings/members`)
  await expect(benPage.getByText("cal", { exact: true })).toBeVisible()

  await page.goto(`./#/s/${spaceId}/watch/${itemId}`)
  await recommend(page, "ben", "Bring tissues")
  await benPage.goto(`./#/s/${spaceId}/home`)
  const inbox = benPage.getByRole("region", { name: "Recommended to you" })
  await expect(inbox.getByRole("link", { name: "Spirited Away" })).toBeVisible()
  await expect(inbox).toContainText("Bring tissues")
  await inbox.getByRole("button", { name: "Acknowledge Spirited Away" }).click()
  await expect(inbox.getByRole("link", { name: "Spirited Away" })).toBeHidden()

  await benPage.goto(`./#/s/${spaceId}/watch/${itemId}`)
  await comment(benPage, "The bathhouse scene is the best part")
  await page.reload()
  await expect(page.getByText("The bathhouse scene is the best part")).toBeVisible()

  await openIdeaTab(page, spaceId, ideaId, "tasks")
  await addTask(page, "Buy snacks", daysFromNow(20).iso)
  await setTaskField(page, "Buy snacks", "Assignee", "ben")
  await benPage.reload()
  await expectNotification(benPage, /ana assigned you a task/)
  await expectNotification(benPage, /ana recommended something for you/)
  await Promise.all([benPage.context().close(), calPage.context().close()])
})

test("an attached image opens for the other member", async ({ page, browser, baseURL }) => {
  const blocker = await edgeFunctionBlocker("attachments", new URL(baseURL!).origin)
  test.skip(blocker !== null, blocker ?? "")
  test.setTimeout(180_000)
  const [ana, ben] = await Promise.all(["ana", "ben"].map(createUser))
  await signIn(page, ana!)
  const spaceId = await createSpace(page, "Release files")
  const benPage = await inviteMember(page, browser, spaceId, ben!)
  const ideaId = await captureIdea(page, spaceId, "Poster wall")
  await openIdeaTab(page, spaceId, ideaId, "research")
  await page.getByLabel("Choose a file to attach").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: PIXEL_PNG,
  })
  // The name shows while uploading; the preview only once the server has finalized the file.
  await expect(page.getByRole("img", { name: "pixel.png" })).toBeVisible()

  await openIdeaTab(benPage, spaceId, ideaId, "research")
  const preview = benPage.getByRole("img", { name: "pixel.png" })
  await expect(preview).toBeVisible()
  await expect
    .poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
  await benPage.context().close()
})
