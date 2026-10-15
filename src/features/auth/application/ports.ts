import type { Result } from "@/shared/domain"
import type { AuthEvent, SessionUser } from "../domain/session"

export interface AuthGateway {
  currentUser(): Promise<SessionUser | null>
  signUp(email: string, password: string, displayName: string, redirectTo: string): Promise<Result<void>>
  signIn(email: string, password: string): Promise<Result<SessionUser>>
  signOut(): Promise<Result<void>>
  requestPasswordReset(email: string, redirectTo: string): Promise<Result<void>>
  resendVerification(email: string, redirectTo: string): Promise<Result<void>>
  updatePassword(password: string): Promise<Result<void>>
  reauthenticate(password: string): Promise<Result<void>>
  exchangeCode(code: string): Promise<Result<SessionUser>>
  onChange(listener: (event: AuthEvent, user: SessionUser | null) => void): () => void
}
