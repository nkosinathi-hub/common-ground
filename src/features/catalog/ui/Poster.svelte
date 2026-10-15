<script lang="ts">
  import { Film } from "@lucide/svelte"
  import { cn } from "$lib/utils"
  import { posterUrl, type PosterSize } from "../domain/rules"

  interface Props {
    path: string | null
    title: string
    size?: PosterSize
    class?: string
  }

  let { path, title, size = "w185", class: className }: Props = $props()

  const src = $derived(posterUrl(path, size))
  let failedSrc = $state<string | null>(null)
</script>

<span
  class={cn(
    "relative flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground",
    className,
  )}
>
  {#if src && failedSrc !== src}
    <img
      {src}
      alt={`${title} poster`}
      loading="lazy"
      class="size-full object-cover"
      onerror={() => (failedSrc = src)}
    />
  {:else}
    <Film class="size-6" strokeWidth={1.4} aria-hidden="true" data-testid="poster-fallback" />
    <span class="sr-only">No poster for {title}</span>
  {/if}
</span>
