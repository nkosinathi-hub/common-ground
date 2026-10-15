<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog"
  import { CatalogSearch, type CatalogTitle } from "@/features/catalog"
  import { toast } from "@/shared/ui"
  import type { Result } from "@/shared/domain"
  import { fromCatalog } from "../domain/catalog"
  import { INTENTS } from "../domain/labels"
  import type { ManualTitleInput, SharedIntent } from "../domain/types"
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

  function done(title: string, result: Result<string>) {
    if (!result.ok) return void toast.error(result.error.message)
    toast.success(`${title} is on your list`)
    open = false
    mode = "search"
    onAdded(result.value)
  }

  async function pick(title: CatalogTitle) {
    if (busy) return
    busy = true
    done(title.title, await service.addCatalog(spaceId, fromCatalog(title), intent))
    busy = false
  }

  async function addManual(input: ManualTitleInput): Promise<Result<string>> {
    const result = await service.addManual(spaceId, { ...input, intent })
    if (result.ok) done(input.title.trim(), result)
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
      onchange={(v) => (intent = v || "want_to_watch")}
    />
    {#if mode === "search"}
      <CatalogSearch {spaceId} onPick={pick} onManual={() => (mode = "manual")} />
    {:else}
      <ManualTitleForm onSubmit={addManual} onBack={() => (mode = "search")} />
    {/if}
  </Dialog.Content>
</Dialog.Root>
