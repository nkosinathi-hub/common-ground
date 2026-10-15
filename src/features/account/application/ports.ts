import type { Result } from "@/shared/domain"

export interface AccountRepository {
  exportSpace(spaceId: string): Promise<Result<unknown>>
  exportMe(): Promise<Result<unknown>>
  deleteMe(): Promise<Result<void>>
  updateDisplayName(userId: string, name: string): Promise<Result<void>>
}

/** Satisfied structurally by the auth feature's AuthService. */
export interface Reauthenticator {
  reauthenticate(password: string): Promise<Result<void>>
  updatePassword(password: string): Promise<Result<void>>
}
