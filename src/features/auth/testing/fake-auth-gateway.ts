import { appError, err, ok, type Result } from "@/shared/domain"
import type { AuthGateway, SignUpRequest } from "../application/ports"
import type { AuthEvent, SessionUser } from "../domain/session"

interface Account {
  password: string
  user: SessionUser
}

export class FakeAuthGateway implements AuthGateway {
  readonly accounts = new Map<string, Account>()
  readonly sent: { kind: string; email: string; redirectTo: string }[] = []
  user: SessionUser | null = null
  private listeners = new Set<(event: AuthEvent, user: SessionUser | null) => void>()

  emit(event: AuthEvent) {
    for (const listener of this.listeners) listener(event, this.user)
  }

  async currentUser() {
    return this.user
  }

  async signUp({ email, password, displayName, redirectTo }: SignUpRequest) {
    if (this.accounts.has(email)) return ok(undefined)
    const user = { id: `user-${this.accounts.size + 1}`, email, displayName, emailConfirmed: false }
    this.accounts.set(email, { password, user })
    this.sent.push({ kind: "verify", email, redirectTo })
    return ok(undefined)
  }

  async signIn(email: string, password: string): Promise<Result<SessionUser>> {
    const account = this.accounts.get(email)
    if (!account || account.password !== password)
      return err(appError("unauthenticated", "Email or password is incorrect"))
    if (!account.user.emailConfirmed) return err(appError("denied", "Confirm your email first"))
    this.user = account.user
    this.emit("signed_in")
    return ok(account.user)
  }

  async signOut() {
    this.user = null
    this.emit("signed_out")
    return ok(undefined)
  }

  async requestPasswordReset(email: string, redirectTo: string) {
    this.sent.push({ kind: "reset", email, redirectTo })
    return ok(undefined)
  }

  async resendVerification(email: string, redirectTo: string) {
    this.sent.push({ kind: "verify", email, redirectTo })
    return ok(undefined)
  }

  async updatePassword(password: string) {
    const account = this.user && this.accounts.get(this.user.email)
    if (!account) return err(appError("unauthenticated", "Please sign in again"))
    account.password = password
    return ok(undefined)
  }

  async reauthenticate(password: string) {
    const account = this.user && this.accounts.get(this.user.email)
    return account?.password === password
      ? ok(undefined)
      : err(appError("denied", "Password is incorrect"))
  }

  async exchangeCode(code: string): Promise<Result<SessionUser>> {
    const account = [...this.accounts.values()].find((a) => a.user.id === code)
    if (!account) return err(appError("validation", "This link has expired"))
    account.user = { ...account.user, emailConfirmed: true }
    this.user = account.user
    this.emit("signed_in")
    return ok(account.user)
  }

  onChange(listener: (event: AuthEvent, user: SessionUser | null) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}
