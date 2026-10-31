<script lang="ts">
  import { LoaderCircle, Shuffle } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { Poster } from "@/features/catalog"
  import { DialogShell, FormError } from "@/shared/ui"
  import type { PickState } from "./pick-state.svelte"

  interface Props {
    picker: PickState
    itemHref: (id: string) => string
  }

  let { picker, itemHref }: Props = $props()
</script>

<!-- Figma S11: one title from the Watch together queue, then pick again or open it. -->
<DialogShell
  bind:open={picker.open}
  title="Tonight's pick"
  description="A random pick from your Watch together queue."
>
  <div aria-live="polite">
    {#if picker.loading}
      <p class="flex items-center gap-related py-section type-sm text-muted-foreground">
        <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />Shuffling your queue
      </p>
    {:else if picker.error}
      <FormError message={picker.error.message} />
    {:else if picker.pick}
      <div class="flex gap-columns">
        <Poster
          path={picker.pick.posterPath}
          title={picker.pick.title}
          size="w342"
          class="h-44 w-30 shrink-0 rounded-md"
        />
        <div class="flex min-w-0 flex-col gap-related">
          {#if picker.pick.releaseYear}<Badge variant="secondary" class="w-fit"
              >{picker.pick.releaseYear}</Badge
            >{/if}
          <h3 class="type-h3 text-foreground">{picker.pick.title}</h3>
          <p class="line-clamp-4 type-sm text-muted-foreground">
            {picker.pick.synopsis || "Get comfortable. A good story is waiting."}
          </p>
        </div>
      </div>
    {:else if picker.emptyQueue}
      <p class="py-stack type-sm text-muted-foreground">
        Nothing in Watch together yet. Set a title's list to Watch together first.
      </p>
    {/if}
  </div>
  {#snippet footer()}
    {#if picker.pick || picker.error}
      <Button variant="outline" disabled={picker.loading} onclick={() => picker.again()}
        ><Shuffle aria-hidden="true" />Pick again</Button
      >
    {/if}
    {#if picker.pick}
      <Button href={itemHref(picker.pick.id)} onclick={() => (picker.open = false)}
        >Open {picker.pick.title}</Button
      >
    {:else}
      <Button variant="outline" onclick={() => (picker.open = false)}>Close</Button>
    {/if}
  {/snippet}
</DialogShell>
