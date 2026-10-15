import { expect, test, type Page } from "@playwright/test"
import { captureIdea, inviteMember, openIdeaTab } from "../support/fixtures"
import { askDelete, ITEM_KINDS, type ItemKind } from "../support/idea-items"
import { createSpace, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()

const DENIED = "Only its author or the space owner can delete this"

// Ana owns the space and authors everything; Ben is a member who authored none of it.
let ana: Page
let ben: Page
let spaceId = ""
let ideaId = ""

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000)
  const [owner, member] = await Promise.all([createUser("ana"), createUser("ben")])
  ana = await (await browser.newContext()).newPage()
  await signIn(ana, owner)
  spaceId = await createSpace(ana, "Delete test")
  ben = await inviteMember(ana, browser, spaceId, member)
  ideaId = await captureIdea(ana, spaceId, "Garden club")
})

test.afterAll(async () => {
  await ben?.context().close()
  await ana?.context().close()
})

// Reloads every time: a hash goto to the tab already open would keep stale data.
async function visit(page: Page, kind: ItemKind) {
  await openIdeaTab(page, spaceId, ideaId, kind.tab)
  await page.reload()
  await expect(page.getByRole("tabpanel", { name: kind.tab })).toBeVisible()
  await kind.reveal?.(page)
}

for (const kind of ITEM_KINDS) {
  test(`deleting a ${kind.name} asks first, and only its author or the owner may`, async () => {
    test.setTimeout(60_000)
    const suffix = `${kind.name} ${test.info().repeatEachIndex}`
    const mine = `Ana ${suffix}`
    const theirs = `Kept ${suffix}`
    await visit(ana, kind)
    await kind.add(ana, mine)
    await expect(kind.row(ana, mine)).toBeVisible()
    await kind.add(ana, theirs)
    await expect(kind.row(ana, theirs)).toBeVisible()

    const cancelled = await askDelete(ana, kind, mine)
    await cancelled.getByRole("button", { name: "Cancel" }).click()
    await expect(cancelled).toBeHidden()
    await expect(kind.row(ana, mine)).toBeVisible()

    const confirmed = await askDelete(ana, kind, mine)
    await confirmed.getByRole("button", { name: "Delete" }).click()
    await expect(kind.row(ana, mine)).toHaveCount(0)
    await visit(ana, kind)
    await expect(kind.row(ana, theirs)).toBeVisible()
    await expect(kind.row(ana, mine)).toHaveCount(0)

    await visit(ben, kind)
    const refused = await askDelete(ben, kind, theirs)
    await refused.getByRole("button", { name: "Delete" }).click()
    await expect(ben.getByRole("alert").filter({ hasText: DENIED })).toBeVisible()
    await expect(kind.row(ben, theirs)).toBeVisible()
    await visit(ben, kind)
    await expect(kind.row(ben, theirs)).toBeVisible()
  })
}
