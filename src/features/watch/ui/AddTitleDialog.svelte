<script lang="ts">
  import { tick, untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { CatalogSearch } from "@/features/catalog"
  import { buildHash, type Result } from "@/shared/domain"
  import { toast } from "@/shared/ui"
  import { INTENTS } from "../domain/labels"
  import type { SharedIntent, TitleDetailsInput } from "../domain/types"
  import { AddTitleState } from "./add-title-state.svelte"
  import AddedList from "./AddedList.svelte"
  import Choice from "./Choice.svelte"
  import { useWatch } from "./context"
  import ManualTitleForm from "./ManualTitleForm.svelte"

  interface Props {
    open: boolean
    spaceId: string
    onAdded: (id: string) => void
    /** The space's default list for new titles. */
    defaultIntent?: SharedIntent
  }

  let {
    open = $bindable(false),
    spaceId,
    onAdded,
    defaultIntent = "want_to_watch",
  }: Props = $props()
  let mode = $state<"search" | "manual">("search")
  let intent = $state<SharedIntent>(untrack(() => defaultIntent))
  const adds = new AddTitleState(
    useWatch().service,
    () => spaceId,
    () => intent,
  )
  let body = $state<HTMLElement>()
  const href = (itemId: string) => buildHash({ name: "watch-item", spaceId, itemId })

  $effect(() => {
    if (!open) untrack(() => (adds.reset(), (mode = "search"), (intent = defaultIntent)))
  })

  /** After an add: back on the search as it was, with focus in it to keep going. */
  async function settle(result: Result<string> | null) {
    if (!result) return
    if (!result.ok && result.error.kind === "conflict") return toast(result.error.message)
    if (!result.ok) return toast.error(result.error.message)
    mode = "search"
    onAdded(result.value)
    await tick()
    body?.querySelector<HTMLInputElement>('input[type="search"]')?.focus()
  }

  async function addManual(input: TitleDetailsInput): Promise<Result<string>> {
    const result = await adds.addManual(input)
    if (result.ok) await settle(result)
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
    <div bind:this={body}>
      <!-- Hidden, not unmounted, while adding by hand, so the search is still there after. -->
      <div class={mode === "search" ? "" : "hidden"}>
        <CatalogSearch
          {spaceId}
          onPick={async (title) => settle(await adds.pick(title))}
          onManual={() => (mode = "manual")}
          statusOf={(title) => adds.statusOf(title)}
        />
      </div>
      {#if mode === "manual"}
        <ManualTitleForm onSubmit={addManual} onBack={() => (mode = "search")} />
      {/if}
    </div>
    <AddedList items={adds.added} {href} />
    <Dialog.Footer>
      <Button onclick={() => (open = false)}>Done</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
