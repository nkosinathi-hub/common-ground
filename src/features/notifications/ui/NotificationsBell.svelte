<script lang="ts">
  import { MediaQuery } from "svelte/reactivity"
  import { Bell, CheckCheck, X } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Popover from "$lib/components/ui/popover"
  import * as Sheet from "$lib/components/ui/sheet"
  import type { Notification } from "../domain/notification"
  import { useNotifications } from "./context"
  import NotificationList from "./NotificationList.svelte"

  /** The badge stops counting here; more reads as "9+". */
  const BADGE_MAX = 9

  const { store } = useNotifications()
  // Phones get a full-screen sheet; a popover is too cramped below the sm breakpoint.
  const wide = new MediaQuery("min-width: 640px")
  let open = $state(false)
  const badge = $derived(store.unread > BADGE_MAX ? `${BADGE_MAX}+` : String(store.unread))

  function follow(item: Notification) {
    void store.open(item)
    open = false
  }
</script>

{#snippet bell(props: Record<string, unknown>)}
  <Button
    {...props}
    variant="ghost"
    size="icon-sm"
    class="relative max-md:size-11"
    aria-label={store.unread > 0 ? `Notifications, ${store.unread} unread` : "Notifications"}
  >
    <Bell aria-hidden="true" />
    {#if store.unread > 0}
      <span
        class="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground"
      >
        {badge}
      </span>
    {/if}
  </Button>
{/snippet}

{#snippet markAll()}
  {#if store.unread > 0}
    <Button size="sm" variant="ghost" onclick={() => store.markAll()}>
      <CheckCheck class="size-4" aria-hidden="true" />Mark all read
    </Button>
  {/if}
{/snippet}

{#if wide.current}
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}{@render bell(props)}{/snippet}
    </Popover.Trigger>
    <Popover.Content align="end" class="w-80 p-0">
      <div class="flex items-center justify-between border-b px-3 py-2">
        <h2 class="text-sm font-semibold">Notifications</h2>
        {@render markAll()}
      </div>
      <NotificationList onFollow={follow} class="max-h-96" />
    </Popover.Content>
  </Popover.Root>
{:else}
  <Sheet.Root bind:open>
    <Sheet.Trigger>
      {#snippet child({ props })}{@render bell(props)}{/snippet}
    </Sheet.Trigger>
    <!-- The header's own Close replaces the sheet's small corner one (a 44px target on phones). -->
    <Sheet.Content
      side="bottom"
      class="h-dvh w-full max-w-none gap-0 p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] [&>[data-dialog-close]]:hidden"
    >
      <div class="flex items-center gap-2 border-b px-3 py-1">
        <Sheet.Title class="flex-1 text-base">Notifications</Sheet.Title>
        {@render markAll()}
        <Sheet.Close>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" size="icon" class="size-11" aria-label="Close">
              <X class="size-5" aria-hidden="true" />
            </Button>
          {/snippet}
        </Sheet.Close>
      </div>
      <NotificationList onFollow={follow} class="min-h-0 flex-1" />
    </Sheet.Content>
  </Sheet.Root>
{/if}
