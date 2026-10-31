<script lang="ts">
  import { DialogShell, FormError, FormState, toast } from "@/shared/ui"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"
  import { TitleFormState } from "./title-form-state.svelte"
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

  async function submit() {
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

<!-- Edit a title's details, in the shared dialog; the same fields as adding one by hand (S04). -->
<DialogShell
  bind:open
  title="Edit this title"
  description="Changes show for everyone in this space."
  primary="Save changes"
  busy={submission.pending}
  onsubmit={submit}
>
  <TitleFields form={fields} prefix="edit" errorFor={(f) => submission.fieldError(f)} />
  <FormError message={submission.formError} />
</DialogShell>
