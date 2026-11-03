<script lang="ts">
  import { Compass, Bell, Ellipsis, Lightbulb, LogOut, Settings, UserRound } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Popover from "$lib/components/ui/popover"
  import { openCapture } from "@/features/ideas"
  import { NotificationsBell } from "@/features/notifications"
  import { buildHash } from "@/shared/domain"
  import { RevealContent } from "@/shared/ui"
  let {
    spaceId,
    routeKey,
    onSignOut,
    onNavigate,
  }: {
    spaceId: string
    routeKey: string
    onNavigate: () => void
    onSignOut: () => void
  } = $props()
  let open = $state(false),
    notifications = $state(false)
  let trigger = $state<HTMLButtonElement | null>(null)
  $effect(() => {
    void routeKey
    open = false
  })
  const close = () => (open = false)
</script>

<Popover.Root bind:open>
  <Popover.Trigger aria-label="More">
    {#snippet child({ props })}
      <Button
        {...props}
        bind:ref={trigger}
        variant="ghost"
        size="icon"
        class="reveal-trigger rounded-full"
      >
        <RevealContent icon={Ellipsis} label="More" compact />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    aria-label="Space tools"
    align="end"
    class="flex w-60 flex-col gap-related p-related duration-200"
  >
    <Button
      variant="ghost"
      class="h-11 justify-start"
      onclick={() => {
        close()
        onNavigate()
      }}
    >
      <Compass aria-hidden="true" />Navigate
    </Button>
    <Button
      variant="ghost"
      class="h-11 justify-start"
      onclick={() => {
        close()
        openCapture()
      }}
    >
      <Lightbulb aria-hidden="true" />Capture idea
    </Button>
    <Button
      variant="ghost"
      class="h-11 justify-start"
      onclick={() => {
        close()
        notifications = true
      }}><Bell aria-hidden="true" />Notifications</Button
    >
    <Button
      variant="ghost"
      class="h-11 justify-start"
      href={buildHash({ name: "settings", spaceId })}
      onclick={close}><Settings aria-hidden="true" />Space settings</Button
    >
    <Button
      variant="ghost"
      class="h-11 justify-start"
      href={buildHash({ name: "account" })}
      onclick={close}><UserRound aria-hidden="true" />Account and data</Button
    >
    <Button variant="ghost" class="h-11 justify-start" onclick={onSignOut}
      ><LogOut aria-hidden="true" />Sign out</Button
    >
  </Popover.Content>
</Popover.Root>
<NotificationsBell bind:open={notifications} hideTrigger restoreFocus={() => trigger?.focus()} />
