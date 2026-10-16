<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { FormError, FormState, toast } from "@/shared/ui"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"
  import { TitleFormState } from "./title-form.svelte"
  import TitleFields from "./TitleFields.svelte"

  interface Props {
    open: boolean
    item: WatchItem
    onSaved: () => void
  }

  let { open = $bindable(false), item, onSaved }: Props = $props()
  const { service } = useWatch()
  const fields = new TitleFormState()
  const submission = new FormState()

  $effect(() => {
    if (open) fields.fill(item)
  })

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const saved = await submission.run(async () => {
      const input = fields.toInput()
      return input.ok ? service.updateDetails(item.id, input.value) : input
    })
    if (!saved.ok) return
    toast.success("Details saved")
    open = false
    onSaved()
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[90dvh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Edit this title</Dialog.Title>
      <Dialog.Description>Changes show for everyone in this space.</Dialog.Description>
    </Dialog.Header>
    <form class="grid gap-4" onsubmit={submit} novalidate>
      <TitleFields form={fields} prefix="edit" errorFor={(f) => submission.fieldError(f)} />
      <FormError message={submission.formError} />
      <Dialog.Footer>
        <Button type="button" variant="ghost" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" disabled={submission.pending}>Save</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
