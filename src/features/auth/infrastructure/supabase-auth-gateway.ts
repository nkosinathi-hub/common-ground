import type { User } from "@supabase/supabase-js"
import { appError, err, ok, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import { done, signedOut, type QueryError } from "@/shared/infrastructure/query"
import type { Db } from "@/shared/infrastructure/supabase"
import type { AuthGateway, SignUpRequest } from "../application/ports"
import type { AuthEvent, SessionUser } from "../domain/session"

const EVENTS: Record<string, AuthEvent> = {
  SIGNED_IN: "signed_in",
  SIGNED_OUT: "signed_out",
  PASSWORD_RECOVERY: "password_recovery",
  TOKEN_REFRESHED: "refreshed",
  USER_UPDATED: "refreshed",
}

const TOO_MANY_REQUESTS = 429
const SERVER_ERROR = 500

const toUser = (user: User): SessionUser => ({
  id: user.id,
  email: user.email ?? "",
  displayName: String(user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? ""),
  emailConfirmed: Boolean(user.email_confirmed_at),
})

/** Server trouble is not a wrong password: 5xx, 429, timeouts and network failures ask to retry. */
const isOutage = ({ status, code }: QueryError) =>
  !status || status >= SERVER_ERROR || status === TOO_MANY_REQUESTS || code === "request_timeout"

export class SupabaseAuthGateway implements AuthGateway {
  constructor(private readonly db: Db) {}

  async currentUser() {
    const { data } = await this.db.auth.getSession()
    return data.session ? toUser(data.session.user) : null
  }

  signUp({ email, password, displayName, redirectTo }: SignUpRequest) {
    const options = { emailRedirectTo: redirectTo, data: { display_name: displayName } }
    return done(this.db.auth.signUp({ email, password, options }))
  }

  async signIn(email: string, password: string): Promise<Result<SessionUser>> {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password })
    if (error?.code === "email_not_confirmed")
      return err(appError("denied", "Confirm your email first"))
    if (error && isOutage(error)) return err(toAppError({ status: error.status ?? 0 }))
    if (error || !data.user)
      return err(appError("unauthenticated", "Email or password is incorrect"))
    return ok(toUser(data.user))
  }

  signOut = () => done(this.db.auth.signOut())

  requestPasswordReset = (email: string, redirectTo: string) =>
    done(this.db.auth.resetPasswordForEmail(email, { redirectTo }))

  resendVerification = (email: string, redirectTo: string) =>
    done(this.db.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectTo } }))

  updatePassword = (password: string) => done(this.db.auth.updateUser({ password }))

  async reauthenticate(password: string): Promise<Result<void>> {
    const user = await this.currentUser()
    if (!user) return signedOut()
    const { error } = await this.db.auth.signInWithPassword({ email: user.email, password })
    return error ? err(appError("denied", "Password is incorrect")) : ok(undefined)
  }

  async exchangeCode(code: string): Promise<Result<SessionUser>> {
    const { data, error } = await this.db.auth.exchangeCodeForSession(code)
    if (error || !data.user)
      return err(appError("validation", "This link has expired or was already used"))
    return ok(toUser(data.user))
  }

  onChange(listener: (event: AuthEvent, user: SessionUser | null) => void) {
    const { data } = this.db.auth.onAuthStateChange((event, session) => {
      const mapped = EVENTS[event]
      if (mapped) listener(mapped, session ? toUser(session.user) : null)
    })
    return () => data.subscription.unsubscribe()
  }
}
