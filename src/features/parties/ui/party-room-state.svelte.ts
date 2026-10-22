import type { AppError, Result } from "@/shared/domain"
import { PartySession, type SessionView } from "../application/party-session"
import { isOpen, memberOf, type Party } from "../domain/party"
import type { PartiesContext } from "./context"

/** One party page: loads the party, joins it while open, and runs this member's session. */
export class PartyRoomState {
  party = $state<Party | null>(null)
  view = $state<SessionView | null>(null)
  error = $state<AppError | null>(null)
  private session: PartySession | null = null

  constructor(
    private readonly context: PartiesContext,
    private readonly partyId: string,
    private readonly me: string,
  ) {}

  async open(): Promise<void> {
    const { service } = this.context
    if (!(await this.reload())) return
    if (!this.party || !isOpen(this.party)) return
    const joined = await service.join(this.partyId)
    if (!joined.ok) return void (this.error = joined.error)
    if (!(await this.reload())) return
    const party = this.party
    const joinedAt = memberOf(party, this.me)?.joinedAt ?? "1970-01-01T00:00:00Z"
    const { channel, clock } = this.context
    const player = party.source === "jellyfin" ? this.context.player() : null
    // On Netflix the extension plays; this page is the remote beside it (#66).
    const role = party.source === "netflix" ? ("remote" as const) : undefined
    const me = this.me
    this.session = new PartySession({ me, joinedAt, party, channel, player, clock, service, role })
    this.session.subscribe((view) => (this.view = view))
    this.session.open()
  }

  close(): void {
    this.session?.close()
    this.session = null
  }

  ready = (): Promise<Result<void>> => this.session!.ready()
  play = () => this.session?.play()
  pause = () => this.session?.pause()
  seek = (seconds: number) => this.session?.seek(seconds)
  countdown = () => this.session?.countdown()
  now = () => this.session?.now() ?? this.context.clock.now()

  async finish(): Promise<Result<void>> {
    const done = await this.session!.finish()
    if (done.ok) await this.reload()
    return done
  }

  async cancel(): Promise<Result<void>> {
    const done = await this.context.service.cancel(this.partyId)
    if (done.ok) {
      this.close()
      await this.reload()
    }
    return done
  }

  private async reload(): Promise<boolean> {
    const found = await this.context.service.get(this.partyId)
    if (!found.ok) {
      this.error = found.error
      return false
    }
    this.party = found.value
    return true
  }
}
