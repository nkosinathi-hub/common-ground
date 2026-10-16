import type { AuthService } from "../application/auth-service"
import type { SessionUser } from "../domain/session"

/** Reactive session. The app awaits start() before rendering, so no private UI flashes. */
export class SessionStore {
  user = $state<SessionUser | null>(null)
  private stop: (() => void) | null = null

  constructor(private readonly service: AuthService) {}

  async start(): Promise<void> {
    this.stop = this.service.onChange((_event, user) => {
      if (!sameUser(this.user, user)) this.user = user
    })
    this.user = await this.service.currentUser()
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
