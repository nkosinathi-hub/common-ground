<script lang="ts">
  import { LoaderCircle, Shuffle } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { Poster } from "@/features/catalog"
  import { FormError } from "@/shared/ui"
  import type { PickState } from "./pick-state.svelte"

  interface Props {
    picker: PickState
    itemHref: (id: string) => string
  }

  let { picker, itemHref }: Props = $props()
</script>

<Dialog.Root bind:open={picker.open}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Tonight's little adventure</Dialog.Title>
      <Dialog.Description>A random pick from your Watch together queue.</Dialog.Description>
    </Dialog.Header>
    <div class="flex flex-col items-center gap-4 text-center" aria-live="polite">
      {#if picker.loading}
        <p class="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
          Shuffling your queue
        </p>
      {:else if picker.error}
        <FormError message={picker.error.message} />
        <Button variant="outline" onclick={() => picker.again()}>Try again</Button>
      {:else if picker.pick}
        <Poster
          path={picker.pick.posterPath}
          title={picker.pick.title}
          size="w342"
          class="h-48 w-32"
        />
        <h3 class="text-lg font-semibold">{picker.pick.title}</h3>
        <p class="line-clamp-4 text-sm text-muted-foreground">
          {picker.pick.synopsis || "Get comfortable. A good story is waiting."}
        </p>
        <div class="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onclick={() => picker.again()}>
            <Shuffle aria-hidden="true" />
            One more pick
          </Button>
          <Button href={itemHref(picker.pick.id)} onclick={() => (picker.open = false)}>Open</Button
          >
        </div>
      {:else if picker.emptyQueue}
        <p class="py-6 text-sm text-muted-foreground">
          Nothing in Watch together yet. Set a title's list to Watch together first.
        </p>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
