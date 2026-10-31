import type { Result } from "@/shared/domain"
import { FormState } from "@/shared/ui"
import type { TitleDetailsInput } from "../domain/types"
import { TitleFormState } from "./title-form-state.svelte"

/** Adding a title by hand (S04): the typed fields and the save, emptied once it is added. */
export class ManualAdd {
  readonly fields = new TitleFormState()
  readonly submission = new FormState()

  constructor(private readonly add: (input: TitleDetailsInput) => Promise<Result<string>>) {}

  get canAdd(): boolean {
    return !this.submission.pending && this.fields.title.trim().length > 0
  }

  async submit(): Promise<Result<string> | null> {
    const done = await this.submission.run(async () => {
      const input = this.fields.toInput()
      return input.ok ? this.add(input.value) : input
    })
    if (!done.ok) return null
    this.fields.reset()
    return done
  }
}
