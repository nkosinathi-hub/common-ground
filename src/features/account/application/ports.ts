import type { Reauthenticator, Result } from "@/shared/domain"

export interface AccountRepository {
  exportSpace(spaceId: string): Promise<Result<unknown>>
  exportMe(): Promise<Result<unknown>>
  deleteMe(): Promise<Result<void>>
  updateDisplayName(userId: string, name: string): Promise<Result<void>>
}

/** Sets a new password for the signed-in user. */
export interface PasswordUpdater {
  updatePassword(password: string): Promise<Result<void>>
}

/** Satisfied structurally by the auth feature's AuthService. */
export type AccountAuth = Reauthenticator & PasswordUpdater
