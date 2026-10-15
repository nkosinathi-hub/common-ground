import type { User } from "@supabase/supabase-js"
import { appError, err, ok, type Result } from "@/shared/domain"
import { toAppError } from "@/shared/infrastructure/errors"
import type { Db } from "@/shared/infrastructure/supabase"
import type { AuthGateway } from "../application/ports"
import type { AuthEvent, SessionUser } from "../domain/session"

const toUser = (user: User): SessionUser => ({
  id: user.id,
  email: user.email ?? "",
  displayName: String(user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? ""),
  emailConfirmed: Boolean(user.email_confirmed_at),
})

const done = (error: { code?: string; message?: string; status?: number } | null): Result<void> =>
  error ? err(toAppError(error)) : ok(undefined)

const EVENTS: Record<string, AuthEvent> = {
  SIGNED_IN: "signed_in",
  SIGNED_OUT: "signed_out",
  PASSWORD_RECOVERY: "password_recovery",
  TOKEN_REFRESHED: "refreshed",
  USER_UPDATED: "refreshed",
}

export class SupabaseAuthGateway implements AuthGateway {
  constructor(private readonly db: Db) {}

  async currentUser() {
    const { data } = await this.db.auth.getSession()
    return data.session ? toUser(data.session.user) : null
  }

  async signUp(email: string, password: string, displayName: string, redirectTo: string) {
    const options = { emailRedirectTo: redirectTo, data: { display_name: displayName } }
    return done((await this.db.auth.signUp({ email, password, options })).error)
  }

  async signIn(email: string, password: string): Promise<Result<SessionUser>> {
    const { data, error } = await this.db.auth.signInWithPassword({ email, password })
    if (error?.code === "email_not_confirmed")
      return err(appError("denied", "Confirm your email first"))
    if (error || !data.user)
      return err(appError("unauthenticated", "Email or password is incorrect"))
    return ok(toUser(data.user))
  }

  signOut = async () => done((await this.db.auth.signOut()).error)

  requestPasswordReset = async (email: string, redirectTo: string) =>
    done((await this.db.auth.resetPasswordForEmail(email, { redirectTo })).error)

  resendVerification = async (email: string, redirectTo: string) =>
    done(
      (
        await this.db.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: redirectTo },
        })
      ).error,
    )

  updatePassword = async (password: string) =>
    done((await this.db.auth.updateUser({ password })).error)

  async reauthenticate(password: string) {
    const user = await this.currentUser()
    if (!user) return err(appError("unauthenticated", "Please sign in again"))
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
