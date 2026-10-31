<script lang="ts">
  import { Ellipsis, LogOut, UserRound } from "@lucide/svelte"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { cn } from "$lib/utils"
  import { useAuth } from "@/features/auth"
  import { InitialAvatar, navigate } from "@/shared/ui"

  interface Props {
    /** Rail: avatar, name and "Account". Bar: the avatar alone, 44 px to tap. */
    variant: "rail" | "bar"
    active?: boolean
    onSignOut: () => void
  }

  let { variant, active = false, onSignOut }: Props = $props()
  const { session } = useAuth()
  const name = $derived(session.user?.displayName ?? "")
</script>

<!-- Privacy lives on the Account page now, not in this menu. -->
<DropdownMenu.Root>
  <DropdownMenu.Trigger aria-label="Account">
    {#snippet child({ props })}
      <button
        {...props}
        class={cn(
          "flex items-center gap-item rounded-md text-left outline-none",
          variant === "rail"
            ? "w-full p-related hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-sidebar-foreground/40"
            : "size-11 justify-center focus-visible:ring-3 focus-visible:ring-ring/20",
          active && variant === "rail" && "bg-sidebar-accent",
        )}
      >
        <InitialAvatar {name} tone="brand" decorative />
        {#if variant === "rail"}
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate type-label">{name}</span>
            <span class="type-xs opacity-72">Account</span>
          </span>
          <Ellipsis class="size-4 shrink-0" aria-hidden="true" />
        {/if}
      </button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align={variant === "rail" ? "start" : "end"} class="w-56">
    <DropdownMenu.Label class="truncate">{session.user?.email}</DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onSelect={() => navigate({ name: "account" })}>
      <UserRound class="size-4" aria-hidden="true" />Account and data
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onSelect={onSignOut}>
      <LogOut class="size-4" aria-hidden="true" />Sign out
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
