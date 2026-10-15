<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog"
  import { CatalogSearch, type CatalogTitle } from "@/features/catalog"
  import type { Result } from "@/shared/domain"
  import { toast } from "@/shared/ui"
  import { fromCatalog } from "../domain/catalog"
  import { INTENTS } from "../domain/labels"
  import type { SharedIntent, TitleDetailsInput } from "../domain/types"
  import Choice from "./Choice.svelte"
  import { useWatch } from "./context"
  import ManualTitleForm from "./ManualTitleForm.svelte"

  interface Props {
    open: boolean
    spaceId: string
    onAdded: (id: string) => void
  }

  let { open = $bindable(false), spaceId, onAdded }: Props = $props()
  const { service } = useWatch()
  let mode = $state<"search" | "manual">("search")
  let intent = $state<SharedIntent>("want_to_watch")
  let busy = $state(false)

  function added(title: string, result: Result<string>) {
    if (!result.ok) {
      toast.error(result.error.message)
      return
    }
    toast.success(`${title} is on your list`)
    open = false
    mode = "search"
    onAdded(result.value)
  }

  async function pick(title: CatalogTitle) {
    if (busy) return
    busy = true
    added(title.title, await service.addCatalog(spaceId, fromCatalog(title), intent))
    busy = false
  }

  async function addManual(input: TitleDetailsInput): Promise<Result<string>> {
    const result = await service.addManual(spaceId, { ...input, intent })
    if (result.ok) added(input.title.trim(), result)
    return result
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
    <Dialog.Header>
      <Dialog.Title>Add a title</Dialog.Title>
      <Dialog.Description>
        Find it in the catalog, or add it by hand if it is not listed.
      </Dialog.Description>
    </Dialog.Header>
    <Choice
      id="add-intent"
      label="Add to"
      value={intent}
      options={INTENTS}
      onchange={(value) => (intent = value || "want_to_watch")}
    />
    {#if mode === "search"}
      <CatalogSearch {spaceId} onPick={pick} onManual={() => (mode = "manual")} />
    {:else}
      <ManualTitleForm onSubmit={addManual} onBack={() => (mode = "search")} />
    {/if}
  </Dialog.Content>
</Dialog.Root>
