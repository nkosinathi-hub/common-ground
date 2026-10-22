import { PartyService } from "@/features/parties/application/party-service"
import { PartySession } from "@/features/parties/application/party-session"
import { isOpen, memberOf } from "@/features/parties/domain/party"
import { positionAt } from "@/features/parties/domain/timeline"
import { SupabasePartyChannel } from "@/features/parties/infrastructure/supabase-party-channel"
import { SupabasePartyGateway } from "@/features/parties/infrastructure/supabase-party-gateway"
import { SupabaseSpacesGateway } from "@/features/spaces/infrastructure/supabase-spaces-gateway"
import type { MemberRef } from "@/shared/domain"
import { extensionDb } from "./client"
import { netflixPlayer, pageSeeker, videoPage } from "./netflix-player"
import { mountOverlay, type OverlayActions } from "./overlay"
import { overlayModel } from "./overlay-model"
import type { MessageWindow } from "./page-seek"

export interface WatchPage {
  readonly doc: Document
  readonly win: MessageWindow
  readonly titleId: () => string | null
}

const SEEK_FAILED = "Netflix would not seek: reload this page"

/**
 * Plays the joined party on this netflix.com tab: the shared sync engine (PartySession) drives
 * the member's own Netflix player, and the overlay shows the party. Returns a function to leave.
 */
export async function playParty(partyId: string, page: WatchPage): Promise<() => void> {
  const { doc, win, titleId } = page
  const db = extensionDb()
  const actions: OverlayActions = { ready: () => undefined, play: () => {}, pause: () => {} }
  const overlay = mountOverlay(doc, {
    ready: () => actions.ready(),
    play: () => actions.play(),
    pause: () => actions.pause(),
  })
  const leave = () => {
    overlay.remove()
    void db.removeAllChannels()
    void db.auth.stopAutoRefresh()
  }
  overlay.render("Joining the party")
  const { data } = await db.auth.getUser()
  if (!data.user) return (overlay.render("Sign in from the Common Ground extension"), leave)
  const me = data.user.id
  const service = new PartyService(new SupabasePartyGateway(db))
  const joined = await service.join(partyId)
  const found = joined.ok ? await service.get(partyId) : joined
  if (!found.ok || !isOpen(found.value))
    return (overlay.render("This watch party has ended"), leave)
  const party = found.value
  const listed = await new SupabaseSpacesGateway(db).members(party.spaceId)
  const names: MemberRef[] = listed.ok
    ? listed.value.map((m) => ({ id: m.userId, displayName: m.displayName }))
    : []

  let seekFailed = false
  const player = netflixPlayer(
    videoPage(doc),
    pageSeeker(win, () => (seekFailed = true)),
  )
  const joinedAt = memberOf(party, me)?.joinedAt ?? new Date().toISOString()
  const channel = new SupabasePartyChannel(db)
  const clock = { now: () => Date.now() }
  const deps = { me, joinedAt, party, channel, player, clock, service, role: "player" as const }
  const session = new PartySession(deps)
  actions.ready = () => void session.ready()
  actions.play = () => session.play()
  actions.pause = () => session.pause()

  const draw = () => {
    const view = session.view
    const playing = view.state.phase === "playing" && view.state.timeline.at <= session.now()
    const drift = playing
      ? positionAt(view.state.timeline, session.now()) - player.currentTime()
      : null
    const ids = new Set([...party.members, ...view.state.people].map((p) => p.userId))
    const members = [...ids].map((userId) => ({ userId }))
    const model = overlayModel({ view, members, names, drift, titleId: titleId() })
    overlay.render(seekFailed ? { ...model, line: SEEK_FAILED } : model)
  }
  const stopListening = session.subscribe(draw)
  const timer = setInterval(draw, 1000)
  session.open()
  return () => {
    clearInterval(timer)
    stopListening()
    session.close()
    leave()
  }
}
