<script lang="ts">
  import { LogOut, Shield, UserRound } from "@lucide/svelte"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { useAuth } from "@/features/auth"

  let { onSignOut }: { onSignOut: () => void } = $props()
  const { session } = useAuth()
  const name = $derived(session.user?.displayName ?? "")
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-sidebar-accent"
    aria-label="Account"
  >
    <span class="grid size-8 place-items-center rounded-full bg-accent font-semibold text-primary">
      {name.charAt(0).toUpperCase()}
    </span>
    <span class="hidden truncate md:inline">{name}</span>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-52">
    <DropdownMenu.Label class="truncate">{session.user?.email}</DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onSelect={() => (location.hash = "#/account")}>
      <UserRound class="size-4" aria-hidden="true" />Account and data
    </DropdownMenu.Item>
    <DropdownMenu.Item onSelect={() => (location.hash = "#/privacy")}>
      <Shield class="size-4" aria-hidden="true" />Privacy
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onSelect={onSignOut}>
      <LogOut class="size-4" aria-hidden="true" />Sign out
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
