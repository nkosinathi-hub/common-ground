import { expect, test, type Page } from "@playwright/test"
import { expectNotification } from "../support/social"
import { requireStack, type TestUser } from "../support/stack"
import { closeDialog, expectFeed, readable, startSharing, threeMembers, waiting } from "./hard-talk"

requireStack()

const WORDS = "I keep thinking about Sunday"
let users: TestUser[] = []
let ana: Page
let ben: Page
let cy: Page

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000)
  const setup = await threeMembers(browser, "Hard talk")
  users = setup.users
  ;[ana, ben, cy] = setup.pages
})

test.afterAll(async () => {
  for (const page of [ana, ben, cy]) await page?.context().close()
})

test("a draft saves privately, resumes, and sends in one step @mobile", async () => {
  test.setTimeout(120_000)
  const dialog = await startSharing(ana, "ben")
  await dialog.getByLabel("What's on my mind").fill(WORDS)
  await expect(dialog.getByRole("status")).toHaveText(/Saved/)
  await closeDialog(ana, dialog)
  await expect(ana.getByRole("region", { name: "Your drafts (1)" })).toBeVisible()
  await expect(ana.getByRole("button", { name: "Write a note" })).toBeFocused()

  await ben.reload()
  await expect(ben.getByRole("button", { name: "Write a note" })).toBeVisible()
  await expect(waiting(ben)).toHaveCount(0)
  await expect(ben.getByText(WORDS)).toHaveCount(0)
  // Straight from the API: nobody but Ana can read her draft.
  expect(await readable(users[1]!, "space_note_drafts")).toEqual([])
  expect(await readable(users[2]!, "space_note_drafts")).toEqual([])
  expect(await readable(users[0]!, "space_note_drafts")).toHaveLength(1)

  await ana.getByRole("button", { name: /^To ben · edited/ }).click()
  const resumed = ana.getByRole("dialog", { name: "Write a note" })
  await expect(resumed.getByLabel("What's on my mind")).toHaveValue(WORDS)
  await resumed.getByLabel("How I feel").fill("a bit left out")
  await resumed.getByText("Can we talk in person?").click()
  await resumed.getByRole("button", { name: "Send to ben" }).click()
  await expect(resumed).toBeHidden()
  await expect(ana.getByText("Sent. ben can open it when they're ready.")).toBeVisible()
  await expect(ana.getByText("No rush. ben hasn't responded yet")).toBeVisible()
  await expect(ana.getByRole("region", { name: /Your drafts/ })).toHaveCount(0)
})

test("the reader finds it at the top of Home, without its words, and responds @mobile", async () => {
  test.setTimeout(120_000)
  await expect(waiting(ben)).toContainText("ana shared something with you")
  await expect(waiting(ben)).toContainText("Take your time.")
  await expect(ben.getByText(WORDS)).toHaveCount(0)
  await expectNotification(ben, /^ana shared something with you/)
  await waiting(ben).getByRole("button", { name: "Open when you're ready" }).click()
  const reader = ben.getByRole("dialog", { name: "From ana" })
  await expect(reader.getByText(WORDS)).toBeVisible()
  await expect(reader.getByText(/ana would like to talk about this in person/)).toBeVisible()
  await reader.getByRole("button", { name: /^I need a little time/ }).click()
  await reader.getByRole("button", { name: "In 3 days" }).click()
  await expect(reader.getByRole("status")).toContainText("Sent: I need a little time")
  await closeDialog(ben, reader)
  await expect(waiting(ben)).toHaveCount(0)
  await expect(ben.getByText("ana shared something with you").first()).toBeVisible()
})

test("the author sees the response and nothing about the reminder @mobile", async () => {
  await expectNotification(ana, /^ben responded to what you shared/)
  await ana.reload()
  const card = ana.getByTestId("home-note").filter({ hasText: "You shared something with ben" })
  await expect(card).toContainText("ben: I need a little time. I'll come back to this")
  await expect(ana.getByText(/remind/i)).toHaveCount(0)
  expect(await readable(users[0]!, "space_note_nudges")).toEqual([])
  expect(await readable(users[1]!, "space_note_nudges")).toHaveLength(1)
})

test("the feed shows it only to the two of them, and the third member sees nothing @mobile", async () => {
  await expectFeed(ana, ["You shared something with ben", "ben responded to what you shared"])
  await expectFeed(ben, ["ana shared something with you", "You responded to what ana shared"])
  await expectFeed(cy, ["joined"], ["shared"])
  await expect(cy.getByTestId("home-note")).toHaveCount(0)
  await expect(waiting(cy)).toHaveCount(0)
  const events = (await readable(users[2]!, "activity_events")) as { event_type: string }[]
  expect(events.filter((e) => e.event_type.startsWith("hard_talk"))).toEqual([])
  expect(await readable(users[2]!, "space_notes")).toEqual([])
  expect(await readable(users[2]!, "space_note_responses")).toEqual([])
})
