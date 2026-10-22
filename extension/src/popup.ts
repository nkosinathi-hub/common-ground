import { SupabasePartyGateway } from "@/features/parties/infrastructure/supabase-party-gateway"
import { SupabaseSpacesGateway } from "@/features/spaces/infrastructure/supabase-spaces-gateway"
import type { MemberRef } from "@/shared/domain"
import { activeParty, local, setActiveParty } from "./chrome-storage"
import { extensionDb } from "./client"
import { el } from "./dom"
import { partyRows, type PartyRow } from "./party-list"
import { partyList, signInForm } from "./popup-view"

const db = extensionDb()
const parties = new SupabasePartyGateway(db)
const spaces = new SupabaseSpacesGateway(db)
const app = document.getElementById("app")!

const say = (text: string) => app.replaceChildren(el(document, "p", { role: "status" }, text))

async function namesIn(spaceIds: readonly string[]): Promise<MemberRef[]> {
  const lists = await Promise.all([...new Set(spaceIds)].map((id) => spaces.members(id)))
  return lists
    .flatMap((l) => (l.ok ? l.value : []))
    .map((m) => ({ id: m.userId, displayName: m.displayName }))
}

async function signIn(email: string, password: string): Promise<void> {
  say("Signing in")
  const { error } = await db.auth.signInWithPassword({ email, password })
  if (error) return show(error.message)
  await show()
}

async function join(row: PartyRow): Promise<void> {
  const joined = await parties.join(row.id)
  if (!joined.ok) return say(joined.error.message)
  await setActiveParty(local(), row.id)
  await show()
}

async function signOut(): Promise<void> {
  await setActiveParty(local(), null)
  await db.auth.signOut()
  await show()
}

async function show(problem?: string): Promise<void> {
  const { data } = await db.auth.getSession()
  const session = data.session
  if (!session) {
    app.replaceChildren(signInForm(document, (e, p) => void signIn(e, p)))
    if (problem) app.append(el(document, "p", { role: "alert" }, problem))
    return
  }
  const open = await parties.openOn("netflix")
  if (!open.ok) return say(open.error.message)
  const names = await namesIn(open.value.map((p) => p.spaceId))
  const rows = partyRows(open.value, names, session.user.id, await activeParty(local()))
  const actions = { join: (row: PartyRow) => void join(row), signOut: () => void signOut() }
  app.replaceChildren(partyList(document, rows, actions))
}

void show()
