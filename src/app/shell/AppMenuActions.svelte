<script lang="ts">
  import { Bell, Compass, Lightbulb, LogOut, Settings, UserRound } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { openCapture } from "@/features/ideas"
  import type { NotificationsStore } from "@/features/notifications"
  import { usePageActions } from "@/shared/ui"
  import { buildHash } from "@/shared/domain"
  let {
    spaceId,
    store,
    choose,
    onNavigate,
    onNotifications,
    onSignOut,
    onClose,
  }: {
    spaceId: string
    store: NotificationsStore
    choose: (action: () => void) => void
    onNavigate: () => void
    onNotifications: () => void
    onSignOut: () => void
    onClose: () => void
  } = $props()
  const actions = usePageActions()
</script>

{#if actions?.tools.length}
  <div class="flex flex-col gap-related border-t border-border pt-related">
    {#each actions.tools as tool (tool)}
      <Button
        variant="ghost"
        class="h-11 justify-start"
        disabled={tool.disabled}
        onclick={() => choose(tool.onclick)}
      >
        <tool.icon aria-hidden="true" />{tool.label}
      </Button>
    {/each}
  </div>
{/if}
<div class="flex flex-col gap-related border-t border-border pt-related">
  <Button variant="ghost" class="h-11 justify-start" onclick={onNavigate}>
    <Compass aria-hidden="true" />Navigate
  </Button>
  <Button variant="ghost" class="h-11 justify-start" onclick={() => choose(openCapture)}>
    <Lightbulb aria-hidden="true" />Capture idea
  </Button>
  <Button variant="ghost" class="h-11 justify-start" onclick={onNotifications}>
    <Bell aria-hidden="true" />{store.unread > 0
      ? `Notifications, ${store.unread} unread`
      : "Notifications"}
  </Button>
  <Button
    variant="ghost"
    class="h-11 justify-start"
    href={buildHash({ name: "settings", spaceId })}
    onclick={onClose}
  >
    <Settings aria-hidden="true" />Space settings
  </Button>
  <Button
    variant="ghost"
    class="h-11 justify-start"
    href={buildHash({ name: "account" })}
    onclick={onClose}
  >
    <UserRound aria-hidden="true" />Account and data
  </Button>
  <Button variant="ghost" class="h-11 justify-start" onclick={onSignOut}>
    <LogOut aria-hidden="true" />Sign out
  </Button>
</div>
