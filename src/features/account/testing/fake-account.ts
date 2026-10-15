import { appError, err, ok, type Result } from "@/shared/domain"
import type { AccountAuth, AccountRepository } from "../application/ports"
import { MIN_PASSWORD } from "../domain/account"

export class FakeAccountRepository implements AccountRepository {
  readonly calls: string[] = []
  readonly names = new Map<string, string>()
  spaces: Record<string, unknown> = {}
  deleteError: Result<void> | null = null

  async exportSpace(spaceId: string): Promise<Result<unknown>> {
    this.calls.push(`exportSpace:${spaceId}`)
    return spaceId in this.spaces
      ? ok(this.spaces[spaceId])
      : err(appError("denied", "You do not have access to that"))
  }

  async exportMe(): Promise<Result<unknown>> {
    this.calls.push("exportMe")
    return ok({ email: "ana@example.com" })
  }

  async deleteMe(): Promise<Result<void>> {
    this.calls.push("deleteMe")
    return this.deleteError ?? ok(undefined)
  }

  async updateDisplayName(userId: string, name: string): Promise<Result<void>> {
    this.calls.push(`rename:${userId}`)
    this.names.set(userId, name)
    return ok(undefined)
  }
}

export class FakeReauthenticator implements AccountAuth {
  password = "correct horse"

  async reauthenticate(password: string): Promise<Result<void>> {
    return password === this.password
      ? ok(undefined)
      : err(appError("denied", "Password is incorrect"))
  }

  async updatePassword(password: string): Promise<Result<void>> {
    if (password.length < MIN_PASSWORD)
      return err(appError("validation", `Use at least ${MIN_PASSWORD} characters`, "password"))
    this.password = password
    return ok(undefined)
  }
}
