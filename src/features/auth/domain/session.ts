export interface SessionUser {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly emailConfirmed: boolean
}

export type AuthEvent = "signed_in" | "signed_out" | "password_recovery" | "refreshed"
