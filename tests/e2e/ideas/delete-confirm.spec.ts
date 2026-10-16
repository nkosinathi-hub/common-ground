import { expect, test, type Page } from "@playwright/test"
import type { SupabaseClient } from "@supabase/supabase-js"
import { signedInClient } from "../support/clients"
import { captureIdea, ideaSection, inviteMember, openIdeaTab } from "../support/fixtures"
import { askDelete, ITEM_KINDS, type ItemKind } from "../support/idea-items"
import { createSpace, projectPage, signIn } from "../support/session"
import { createUser, requireStack } from "../support/stack"

requireStack()

// Where each kind is stored, to check that the server refuses Ben's delete as well.
const STORED: Record<string, [table: string, column: string]> = {
  note: ["idea_notes", "body"],
  link: ["research_links", "title"],
  hypothesis: ["hypotheses", "statement"],
  task: ["tasks", "title"],
  "checklist item": ["task_checklist_items", "label"],
  milestone: ["milestones", "title"],
  "budget line": ["budget_entries", "label"],
}

// Ana owns the space and authors everything; Ben is a member who authored none of it.
let ana: Page
let ben: Page
let benApi: SupabaseClient
let spaceId = ""
let ideaId = ""

test.beforeAll(async ({ browser }) => {
  test.setTimeout(240_000)
  const [owner, member] = await Promise.all([createUser("ana"), createUser("ben")])
  ana = await projectPage(browser)
  await signIn(ana, owner)
  spaceId = await createSpace(ana, "Delete test")
  ben = await inviteMember(ana, browser, spaceId, member)
  ideaId = await captureIdea(ana, spaceId, "Garden club")
  benApi = await signedInClient(member)
})

test.afterAll(async () => {
  await ben?.context().close()
  await ana?.context().close()
})

// Reloads every time: a hash goto to the tab already open would keep stale data.
async function visit(page: Page, kind: ItemKind) {
  await openIdeaTab(page, spaceId, ideaId, kind.tab)
  await page.reload()
  await expect(ideaSection(page, kind.tab)).toBeVisible()
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

    // Ben is not offered the delete, and the server refuses it when he asks directly.
    await visit(ben, kind)
    await expect(kind.row(ben, theirs)).toBeVisible()
    await expect(
      kind.row(ben, theirs).getByRole("button", { name: kind.deleteLabel(theirs) }),
    ).toHaveCount(0)
    const [table, column] = STORED[kind.name]!
    const refused = await benApi.from(table).delete().eq(column, theirs).select("id")
    expect(refused).toMatchObject({ error: null, data: [] })
    await visit(ben, kind)
    await expect(kind.row(ben, theirs)).toBeVisible()
  })
}
