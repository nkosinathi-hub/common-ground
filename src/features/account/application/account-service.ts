import { err, ok, type Result } from "@/shared/domain"
import { validateDisplayName } from "@/shared/domain"
import { exportFilename, validateConfirmation } from "../domain/account"
import type { AccountAuth, AccountRepository } from "./ports"

export interface ExportFile {
  readonly filename: string
  readonly content: string
}

export interface SpaceRef {
  readonly id: string
  readonly name: string
}

export class AccountService {
  constructor(
    private readonly repo: AccountRepository,
    private readonly auth: AccountAuth,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private file(name: string, data: Result<unknown>): Result<ExportFile> {
    if (!data.ok) return data
    const filename = exportFilename(name, this.now())
    return ok({ filename, content: JSON.stringify(data.value, null, 2) })
  }

  private async confirm(password: string, field: string): Promise<Result<void>> {
    const checked = await this.auth.reauthenticate(password)
    return checked.ok ? checked : err({ ...checked.error, field })
  }

  exportSpace = async (space: SpaceRef) =>
    this.file(space.name, await this.repo.exportSpace(space.id))

  exportMe = async () => this.file("my data", await this.repo.exportMe())

  async changeDisplayName(userId: string, name: string): Promise<Result<void>> {
    const valid = validateDisplayName(name)
    if (!valid.ok) return valid
    return this.repo.updateDisplayName(userId, valid.value)
  }

  async changePassword(current: string, next: string): Promise<Result<void>> {
    const confirmed = await this.confirm(current, "currentPassword")
    if (!confirmed.ok) return confirmed
    return this.auth.updatePassword(next)
  }

  /** Confirmation word, then a fresh sign-in (the server checks its age), then deletion. */
  async deleteAccount(password: string, confirmation: string): Promise<Result<void>> {
    const confirmed = validateConfirmation(confirmation)
    if (!confirmed.ok) return confirmed
    const fresh = await this.confirm(password, "password")
    if (!fresh.ok) return fresh
    return this.repo.deleteMe()
  }
}
