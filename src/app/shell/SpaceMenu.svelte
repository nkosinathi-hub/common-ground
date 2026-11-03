<script lang="ts">
  import { Check, ChevronDown, Plus } from "@lucide/svelte"
  import { SpaceAvatar, useSpaces } from "@/features/spaces"
  import { buildHash } from "@/shared/domain"
  let { onSelect }: { onSelect: () => void } = $props()
  const { store } = useSpaces()
</script>

<details class="group rounded-lg bg-muted/40">
  <summary
    class="flex min-h-11 cursor-pointer list-none items-center gap-related rounded-lg px-3 py-2 type-label [&::-webkit-details-marker]:hidden"
  >
    <span class="flex-1">Your spaces</span><ChevronDown
      class="size-4 transition-transform group-open:rotate-180"
      aria-hidden="true"
    />
  </summary>
  <div class="flex flex-col gap-1 p-related pt-0">
    {#each store.spaces as space (space.id)}
      <a
        class="flex min-h-11 items-center gap-related rounded-lg px-3 py-2 hover:bg-secondary"
        href={buildHash({ name: "home", spaceId: space.id })}
        onclick={onSelect}
        aria-current={space.id === store.active?.id ? "page" : undefined}
      >
        <SpaceAvatar {space} class="size-6 type-xs" />
        <span class="flex-1 truncate">{space.name}</span>
        {#if space.id === store.active?.id}<Check class="size-4" aria-label="Current" />{/if}
      </a>
    {/each}
    <a
      class="flex min-h-11 items-center gap-related rounded-lg px-3 py-2 hover:bg-secondary"
      href={buildHash({ name: "new-space" })}
      onclick={onSelect}
    >
      <Plus class="size-4" aria-hidden="true" />New space
    </a>
  </div>
</details>
