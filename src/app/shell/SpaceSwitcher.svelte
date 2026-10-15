<script lang="ts">
  import { Check, ChevronsUpDown, Plus, Settings } from "@lucide/svelte"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { templateFor, useSpaces } from "@/features/spaces"
  import { buildHash } from "@/shared/domain"

  const { store } = useSpaces()
  const active = $derived(store.active)
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent"
    aria-label="Switch space"
  >
    <span
      class="grid size-8 place-items-center rounded-md bg-primary font-serif text-primary-foreground"
    >
      {active?.name.charAt(0).toUpperCase() ?? "?"}
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm font-semibold">{active?.name ?? "No space"}</span>
      <span class="block truncate text-xs text-muted-foreground"
        >{templateFor(active?.template).label}</span
      >
    </span>
    <ChevronsUpDown class="size-4 text-muted-foreground" aria-hidden="true" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-60" align="start">
    <DropdownMenu.Label>Your spaces</DropdownMenu.Label>
    {#each store.spaces as space (space.id)}
      <DropdownMenu.Item
        onSelect={() => (location.hash = buildHash({ name: "home", spaceId: space.id }))}
      >
        <span class="flex-1 truncate">{space.name}</span>
        {#if space.id === active?.id}<Check class="size-4" aria-label="Current" />{/if}
      </DropdownMenu.Item>
    {/each}
    <DropdownMenu.Separator />
    {#if active}
      <DropdownMenu.Item
        onSelect={() => (location.hash = buildHash({ name: "settings", spaceId: active.id }))}
      >
        <Settings class="size-4" aria-hidden="true" />Space settings
      </DropdownMenu.Item>
    {/if}
    <DropdownMenu.Item onSelect={() => (location.hash = buildHash({ name: "new-space" }))}>
      <Plus class="size-4" aria-hidden="true" />New space
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
