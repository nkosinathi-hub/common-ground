<script lang="ts">
  import { untrack } from "svelte"
  import { DialogShell, toast } from "@/shared/ui"
  import type { SharedIntent } from "../domain/types"
  import { AddTitleState } from "./add-title-state.svelte"
  import { useWatch } from "./context"
  import { ManualAdd } from "./manual-add.svelte"
  import ManualTitlePanel from "./ManualTitlePanel.svelte"
  interface Props {
    open: boolean
    spaceId: string
    onAdded: (id: string) => void
    defaultIntent?: SharedIntent
  }
  let {
    open = $bindable(false),
    spaceId,
    onAdded,
    defaultIntent = "want_to_watch",
  }: Props = $props()
  let intent = $state<SharedIntent>(untrack(() => defaultIntent))
  const adds = new AddTitleState(
    useWatch().service,
    () => spaceId,
    () => intent,
  )
  const manual = new ManualAdd((input) => adds.addManual(input))
  $effect(() => {
    if (!open)
      untrack(() => {
        manual.fields.reset()
        adds.reset()
        intent = defaultIntent
      })
  })
  async function save() {
    const result = await manual.submit()
    if (!result) return
    if (!result.ok) {
      toast.error(result.error.message)
      return
    }
    onAdded(result.value)
    open = false
  }
</script>

<DialogShell
  bind:open
  title="Add a title manually"
  description="Use the search above to find catalog titles, or enter your own here."
  primary="Add title"
  disabled={!manual.canAdd}
  busy={manual.submission.pending}
  onsubmit={save}
>
  <ManualTitlePanel fields={manual.fields} submission={manual.submission} bind:intent />
</DialogShell>
