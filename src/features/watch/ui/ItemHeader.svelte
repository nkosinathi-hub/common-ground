<script lang="ts">
  import type { Snippet } from "svelte"
  import { Pencil, Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Poster } from "@/features/catalog"
  import { ConfirmDialog, toast } from "@/shared/ui"
  import { INTENTS, mediaTypeLabel } from "../domain/labels"
  import type { SharedIntent, WatchItemView } from "../domain/types"
  import Choice from "./Choice.svelte"
  import { useWatch } from "./context"
  import EditTitleDialog from "./EditTitleDialog.svelte"

  interface Props {
    view: WatchItemView
    backHref: string
    recommend?: Snippet
    onChanged: () => void
  }

  let { view, backHref, recommend, onChanged }: Props = $props()
  const { service } = useWatch()
  const item = $derived(view.item)
  let editing = $state(false)
  let confirming = $state(false)

  async function changeIntent(intent: SharedIntent) {
    const result = await service.setIntent(item.id, intent)
    if (!result.ok) return void toast.error(result.error.message)
    toast.success("List updated")
    onChanged()
  }

  async function remove() {
    const result = await service.remove(item.id)
    if (!result.ok) return void toast.error(result.error.message)
    toast.success(`${item.title} was removed`)
    window.location.assign(backHref)
  }
</script>

<header class="flex flex-col gap-6 sm:flex-row">
  <Poster
    path={item.posterPath}
    title={item.title}
    size="w342"
    class="h-60 w-40 self-center sm:self-start"
  />
  <div class="min-w-0 flex-1 space-y-4">
    <div>
      <h1 class="text-2xl font-semibold">{item.title}</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {mediaTypeLabel(item.mediaType)}{item.releaseYear ? ` · ${item.releaseYear}` : ""}
      </p>
    </div>
    <p class="text-sm leading-6 text-muted-foreground">
      {item.synopsis || "No synopsis yet. Add a little context to this story."}
    </p>
    <div class="max-w-xs">
      <Choice
        id="item-intent"
        label="Shared list"
        value={item.intent}
        options={INTENTS}
        onchange={(v) => v && changeIntent(v)}
      />
    </div>
    <div class="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onclick={() => (editing = true)}>
        <Pencil aria-hidden="true" />
        Edit details
      </Button>
      {#if view.canDelete}
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive"
          onclick={() => (confirming = true)}
        >
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      {/if}
      {@render recommend?.()}
    </div>
  </div>
</header>

<EditTitleDialog bind:open={editing} {item} onSaved={onChanged} />
<ConfirmDialog
  bind:open={confirming}
  title={`Delete ${item.title}?`}
  description="It leaves the shared list for everyone, with all progress and watched-together history."
  confirmLabel="Delete"
  onConfirm={remove}
/>
