<script lang="ts">
  import { cn } from "$lib/utils"
  import type { Space } from "../domain/space"
  import { useSpaces } from "./context"
  import { iconFor } from "./icons"

  let { space, class: className = "" }: { space: Space | null; class?: string } = $props()
  const { store } = useSpaces()
  const url = $derived(store.mediaUrl(space?.avatarPath ?? null))
  const Icon = $derived(iconFor(space?.icon ?? null))
</script>

<!-- Decorative: the space name always sits next to it. -->
<span
  aria-hidden="true"
  data-testid="space-avatar"
  class={cn(
    "grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-primary font-serif text-primary-foreground",
    className,
  )}
>
  {#if url}
    <img src={url} alt="" class="size-full object-cover" />
  {:else if Icon}
    <Icon class="size-4" />
  {:else}
    {space?.name.charAt(0).toUpperCase() ?? "?"}
  {/if}
</span>
