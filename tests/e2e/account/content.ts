import { expect, type Page } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import { readFile } from "node:fs/promises"
import { admin, stack, type TestUser } from "../support/stack"

/** A signed-in API client for a test user, so content is written under that user's RLS. */
export async function asUser(user: TestUser) {
  const key = stack().PUBLISHABLE_KEY ?? stack().ANON_KEY!
  const client = createClient(stack().API_URL!, key, { auth: { persistSession: false } })
  const { data, error } = await client.auth.signInWithPassword(user)
  if (error) throw error
  return { client, userId: data.user.id }
}

export async function addIdea(user: TestUser, spaceId: string, title: string): Promise<void> {
  const { client } = await asUser(user)
  const { error } = await client.from("ideas").insert({ space_id: spaceId, title })
  if (error) throw error
}

/** Adds a member directly; invites have their own spec. */
export async function join(user: TestUser, spaceId: string): Promise<void> {
  const { userId } = await asUser(user)
  const { error } = await admin()
    .from("space_members")
    .insert({ space_id: spaceId, user_id: userId })
  if (error) throw error
}

interface SpaceExport {
  space: { name: string }
  members: { display_name: string }[]
  tables: { ideas: { title: string; created_by: string | null }[] }
}

/** Clicks an export button on the account page and parses the downloaded file. */
export async function exportFrom<T = SpaceExport>(page: Page, button: string | RegExp) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: button }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^common-ground-[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.json$/)
  return JSON.parse(await readFile((await download.path())!, "utf8")) as T
}
