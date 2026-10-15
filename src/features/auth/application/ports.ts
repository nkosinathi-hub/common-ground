import type { Result } from "@/shared/domain"
import type { SignUpInput } from "../domain/credentials"
import type { AuthEvent, SessionUser } from "../domain/session"

export interface SignUpRequest extends SignUpInput {
  /** Where the verification email sends the new user back to. */
  readonly redirectTo: string
}

export interface AuthGateway {
  currentUser(): Promise<SessionUser | null>
  signUp(request: SignUpRequest): Promise<Result<void>>
  /** Fails with kind "denied" only when the email is not confirmed yet. */
  signIn(email: string, password: string): Promise<Result<SessionUser>>
  signOut(): Promise<Result<void>>
  requestPasswordReset(email: string, redirectTo: string): Promise<Result<void>>
  resendVerification(email: string, redirectTo: string): Promise<Result<void>>
  updatePassword(password: string): Promise<Result<void>>
  reauthenticate(password: string): Promise<Result<void>>
  exchangeCode(code: string): Promise<Result<SessionUser>>
  onChange(listener: (event: AuthEvent, user: SessionUser | null) => void): () => void
}
