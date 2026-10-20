<script lang="ts">
  import type { ComponentProps } from "svelte"
  import { Poster } from "@/features/catalog"
  import { toast } from "@/shared/ui"
  import { INTENTS, mediaTypeLabel } from "../domain/labels"
  import type { SharedIntent } from "../domain/types"
  import Choice from "./Choice.svelte"
  import { useWatch } from "./context"
  import ItemActions from "./ItemActions.svelte"

  // The header forwards everything to ItemActions, so it takes exactly ItemActions' props.
  type Props = ComponentProps<typeof ItemActions>

  let { view, backHref, recommend, onChanged }: Props = $props()
  const { service } = useWatch()
  const item = $derived(view.item)

  async function changeIntent(intent: SharedIntent) {
    const result = await service.setIntent(item.id, intent)
    if (!result.ok) return toast.error(result.error.message)
    toast.success("List updated")
    onChanged()
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
        onchange={(value) => value && changeIntent(value)}
      />
    </div>
    <ItemActions {view} {backHref} {recommend} {onChanged} />
  </div>
</header>
