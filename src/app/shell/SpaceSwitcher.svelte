<script lang="ts">
  import { Check, Plus } from "@lucide/svelte"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { SpaceAvatar, useSpaces } from "@/features/spaces"
  import { Logo, navigate, RevealContent } from "@/shared/ui"

  const { store } = useSpaces()
  const active = $derived(store.active)
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger aria-label="Switch space">
    {#snippet child({ props })}
      <button
        {...props}
        class="reveal-trigger max-w-full rounded-full type-label outline-none focus-visible:ring-3 focus-visible:ring-ring/20"
      >
        <RevealContent label={active?.name ?? "Switch space"} compact align="start">
          {#snippet leading()}
            {#if active}<SpaceAvatar space={active} class="size-6 bg-transparent text-primary" />
            {:else}<Logo size={24} />{/if}
          {/snippet}
        </RevealContent>
      </button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-60 duration-200" align="start">
    <DropdownMenu.Label>Your spaces</DropdownMenu.Label>
    {#each store.spaces as space (space.id)}
      <DropdownMenu.Item onSelect={() => navigate({ name: "home", spaceId: space.id })}>
        <SpaceAvatar {space} class="size-6 type-xs" />
        <span class="flex-1 truncate">{space.name}</span>
        {#if space.id === active?.id}<Check class="size-4" aria-label="Current" />{/if}
      </DropdownMenu.Item>
    {/each}
    <DropdownMenu.Separator />
    <DropdownMenu.Item onSelect={() => navigate({ name: "new-space" })}>
      <Plus class="size-4" aria-hidden="true" />New space
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
