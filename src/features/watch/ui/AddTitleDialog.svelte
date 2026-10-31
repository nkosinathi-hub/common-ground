<script lang="ts">
  import { tick, untrack } from "svelte"
  import { buildHash, type Result } from "@/shared/domain"
  import { DialogShell, toast, ViewToggle } from "@/shared/ui"
  import type { SharedIntent } from "../domain/types"
  import { AddTitleState } from "./add-title-state.svelte"
  import { ADD_COPY, ADD_MODES, type AddMode } from "./add-title-copy"
  import AddedList from "./AddedList.svelte"
  import AddTitleFooter from "./AddTitleFooter.svelte"
  import CatalogPanel from "./CatalogPanel.svelte"
  import { useWatch } from "./context"
  import { ManualAdd } from "./manual-add.svelte"
  import ManualTitlePanel from "./ManualTitlePanel.svelte"

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
  let mode = $state<AddMode>("search")
  let intent = $state<SharedIntent>(untrack(() => defaultIntent))
  const adds = new AddTitleState(
    useWatch().service,
    () => spaceId,
    () => intent,
  )
  const manual = new ManualAdd((input) => adds.addManual(input))
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

  async function addManual() {
    if (mode === "manual") await settle(await manual.submit())
  }
</script>

<!-- Figma S03 (search, add several) and S04 (by hand), one dialog with both. -->
<DialogShell
  bind:open
  wide
  title={ADD_COPY[mode].title}
  description={ADD_COPY[mode].description}
  onsubmit={addManual}
>
  {#snippet header()}
    <ViewToggle
      label="How to add"
      class="w-full! [&>*]:flex-1"
      value={mode}
      options={ADD_MODES}
      onchange={(v) => (mode = v)}
    />
  {/snippet}
  <div bind:this={body} class="flex flex-col gap-stack">
    <!-- Hidden, not unmounted, while adding by hand, so the search is still there after. -->
    <div class={mode === "search" ? "flex flex-col gap-stack" : "hidden"}>
      <CatalogPanel {spaceId} {adds} bind:intent onresult={settle} />
    </div>
    {#if mode === "manual"}<ManualTitlePanel
        fields={manual.fields}
        submission={manual.submission}
        bind:intent
      />{/if}
    <AddedList items={adds.added} {href} />
  </div>
  {#snippet footer()}
    <AddTitleFooter
      {mode}
      canAdd={manual.canAdd}
      ondone={() => (open = false)}
      oncancel={() => (mode = "search")}
    />
  {/snippet}
</DialogShell>
