import { type Result } from "@/shared/domain"
import { callbackUrl, type CallbackNext } from "../domain/callback"
import { validateEmail, validatePassword, validateSignUp, type SignUpInput } from "../domain/credentials"
import type { SessionUser } from "../domain/session"
import type { AuthGateway } from "./ports"

export interface Location {
  readonly origin: string
  readonly basePath: string
}

export class AuthService {
  constructor(
    private readonly gateway: AuthGateway,
    private readonly location: Location,
  ) {}

  private redirect(next: CallbackNext) {
    return callbackUrl(this.location.origin, this.location.basePath, next)
  }

  currentUser = () => this.gateway.currentUser()
  onChange: AuthGateway["onChange"] = (listener) => this.gateway.onChange(listener)
  signOut = () => this.gateway.signOut()
  exchangeCode = (code: string) => this.gateway.exchangeCode(code)

  async signUp(input: SignUpInput): Promise<Result<void>> {
    const valid = validateSignUp(input)
    if (!valid.ok) return valid
    const { email, password, displayName } = valid.value
    return this.gateway.signUp(email, password, displayName, this.redirect("home"))
  }

  async signIn(email: string, password: string): Promise<Result<SessionUser>> {
    const valid = validateEmail(email)
    if (!valid.ok) return valid
    return this.gateway.signIn(valid.value, password)
  }

  async requestPasswordReset(email: string): Promise<Result<void>> {
    const valid = validateEmail(email)
    if (!valid.ok) return valid
    return this.gateway.requestPasswordReset(valid.value, this.redirect("new-password"))
  }

  async resendVerification(email: string): Promise<Result<void>> {
    const valid = validateEmail(email)
    if (!valid.ok) return valid
    return this.gateway.resendVerification(valid.value, this.redirect("home"))
  }

  async updatePassword(password: string): Promise<Result<void>> {
    const valid = validatePassword(password)
    if (!valid.ok) return valid
    return this.gateway.updatePassword(valid.value)
  }

  reauthenticate = (password: string) => this.gateway.reauthenticate(password)
}
