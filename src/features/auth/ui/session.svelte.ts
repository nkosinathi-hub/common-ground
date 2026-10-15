import type { AuthService } from "../application/auth-service"
import type { SessionUser } from "../domain/session"

/** Reactive session. `ready` stays false until the first check, so no private UI flashes. */
export class SessionStore {
  user = $state<SessionUser | null>(null)
  ready = $state(false)
  recovering = $state(false)
  private stop: (() => void) | null = null

  constructor(private readonly service: AuthService) {}

  async start(): Promise<void> {
    this.stop = this.service.onChange((event, user) => {
      if (!sameUser(this.user, user)) this.user = user
      if (event === "password_recovery") this.recovering = true
    })
    this.user = await this.service.currentUser()
    this.ready = true
  }

  dispose() {
    this.stop?.()
  }
}

const sameUser = (a: SessionUser | null, b: SessionUser | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.id === b.id &&
    a.email === b.email &&
    a.displayName === b.displayName &&
    a.emailConfirmed === b.emailConfirmed)
