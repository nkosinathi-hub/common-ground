<script lang="ts">
  import { ArrowLeft } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { FormError, FormState } from "@/shared/ui"
  import type { Result } from "@/shared/domain"
  import type { TitleDetailsInput } from "../domain/types"
  import { TitleFormState } from "./title-form-state.svelte"
  import TitleFields from "./TitleFields.svelte"

  interface Props {
    onSubmit: (input: TitleDetailsInput) => Promise<Result<unknown>>
    onBack: () => void
  }

  let { onSubmit, onBack }: Props = $props()
  const fields = new TitleFormState()
  const submission = new FormState()

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    await submission.run(async () => {
      const input = fields.toInput()
      return input.ok ? onSubmit(input.value) : input
    })
  }
</script>

<form class="grid gap-4" onsubmit={submit} novalidate aria-label="Add a title manually">
  <TitleFields form={fields} prefix="manual" errorFor={(f) => submission.fieldError(f)} />
  <FormError message={submission.formError} />
  <div class="flex flex-wrap justify-between gap-2">
    <Button type="button" variant="ghost" onclick={onBack}>
      <ArrowLeft aria-hidden="true" />
      Back to search
    </Button>
    <Button type="submit" disabled={submission.pending}>Add to your list</Button>
  </div>
</form>
