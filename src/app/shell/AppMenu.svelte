<script lang="ts">
  import * as Popover from "$lib/components/ui/popover"
  import { NotificationsBell, useNotifications } from "@/features/notifications"
  import { Logo } from "@/shared/ui"
  import AppMenuActions from "./AppMenuActions.svelte"
  import SpaceMenu from "./SpaceMenu.svelte"
  let {
    spaceId,
    routeKey,
    onSignOut,
    onNavigate,
  }: {
    spaceId: string
    routeKey: string
    onSignOut: () => void
    onNavigate: () => void
  } = $props()
  let open = $state(false),
    notifications = $state(false)
  let trigger = $state<HTMLButtonElement | null>(null)
  let pending: (() => void) | undefined
  const { store } = useNotifications()
  $effect(() => {
    void routeKey
    open = false
  })
  function choose(action: () => void) {
    pending = action
    open = false
  }
  function closed(isOpen: boolean) {
    if (isOpen || !pending) return
    const action = pending
    pending = undefined
    trigger?.focus()
    action()
  }
</script>

<Popover.Root bind:open onOpenChangeComplete={closed}>
  <Popover.Trigger aria-label="Common Ground menu">
    {#snippet child({ props })}
      <button {...props} bind:this={trigger} class="app-menu-trigger">
        <Logo size={32} />
        {#if store.unread > 0}
          <span class="app-menu-badge" aria-hidden="true">{Math.min(store.unread, 9)}</span>
        {/if}
      </button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    role="dialog"
    aria-label="Common Ground menu"
    align="start"
    class="max-h-[min(80dvh,36rem)] w-72 max-w-[calc(100vw-2rem)] gap-related overflow-y-auto p-related"
    onCloseAutoFocus={(event) => {
      if (pending) event.preventDefault()
    }}
  >
    <p class="px-3 py-2 type-label">Common Ground</p>
    <SpaceMenu onSelect={() => (open = false)} />
    <AppMenuActions
      {spaceId}
      {store}
      {choose}
      onNavigate={() => choose(onNavigate)}
      onNotifications={() => choose(() => (notifications = true))}
      onSignOut={() => choose(onSignOut)}
      onClose={() => (open = false)}
    />
  </Popover.Content>
</Popover.Root>
<NotificationsBell bind:open={notifications} hideTrigger restoreFocus={() => trigger?.focus()} />
