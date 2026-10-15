import type { AppError, Result } from "@/shared/domain"

/** Submission state for a form. Inputs are bound separately, so failed submits keep the text. */
export class FormState {
  pending = $state(false)
  error = $state<AppError | null>(null)

  fieldError(field: string): string | undefined {
    return this.error?.field === field ? this.error.message : undefined
  }

  get formError(): string | undefined {
    return this.error && !this.error.field ? this.error.message : undefined
  }

  async run<T>(action: () => Promise<Result<T>>): Promise<Result<T>> {
    this.pending = true
    this.error = null
    try {
      const result = await action()
      if (!result.ok) this.error = result.error
      return result
    } finally {
      this.pending = false
    }
  }
}
