<script lang="ts">
  import { Check, ChevronDown, Plus, Settings } from "@lucide/svelte"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { SpaceAvatar, templateFor, useSpaces } from "@/features/spaces"
  import { Logo, navigate } from "@/shared/ui"

  interface Props {
    /** Rail: name and kind on the indigo rail. Bar: the logo and name in the mobile app bar. */
    variant: "rail" | "bar"
  }

  let { variant }: Props = $props()
  const { store } = useSpaces()
  const active = $derived(store.active)
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger aria-label="Switch space">
    {#snippet child({ props })}
      {#if variant === "rail"}
        <button
          {...props}
          class="flex w-full items-center gap-item rounded-md px-item py-related text-left outline-none hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-sidebar-foreground/40"
        >
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate type-label">{active?.name ?? "No space"}</span>
            <span class="truncate type-xs opacity-72"
              >{templateFor(active?.template).label} · Private space</span
            >
          </span>
          <ChevronDown class="size-4 shrink-0" aria-hidden="true" />
        </button>
      {:else}
        <button
          {...props}
          class="flex h-11 max-w-full min-w-0 items-center gap-related rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/20"
        >
          <Logo size={32} />
          <span class="truncate type-label text-foreground">{active?.name ?? "No space"}</span>
          <ChevronDown class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      {/if}
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-60" align="start">
    <DropdownMenu.Label>Your spaces</DropdownMenu.Label>
    {#each store.spaces as space (space.id)}
      <DropdownMenu.Item onSelect={() => navigate({ name: "home", spaceId: space.id })}>
        <SpaceAvatar {space} class="size-6 text-xs" />
        <span class="flex-1 truncate">{space.name}</span>
        {#if space.id === active?.id}<Check class="size-4" aria-label="Current" />{/if}
      </DropdownMenu.Item>
    {/each}
    <DropdownMenu.Separator />
    {#if active}
      <DropdownMenu.Item onSelect={() => navigate({ name: "settings", spaceId: active.id })}>
        <Settings class="size-4" aria-hidden="true" />Space settings
      </DropdownMenu.Item>
    {/if}
    <DropdownMenu.Item onSelect={() => navigate({ name: "new-space" })}>
      <Plus class="size-4" aria-hidden="true" />New space
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
