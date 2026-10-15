<script lang="ts">
  import { Bell, CheckCheck } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Popover from "$lib/components/ui/popover"
  import { describeNotification, subjectHref } from "../domain/notification"
  import { useNotifications } from "./context"

  const { store } = useNotifications()
  let open = $state(false)
  const when = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        size="icon"
        class="relative"
        aria-label={store.unread > 0 ? `Notifications, ${store.unread} unread` : "Notifications"}
      >
        <Bell class="size-5" aria-hidden="true" />
        {#if store.unread > 0}
          <span
            class="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground"
          >
            {store.unread > 9 ? "9+" : store.unread}
          </span>
        {/if}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content align="end" class="w-80 p-0">
    <div class="flex items-center justify-between border-b px-3 py-2">
      <h2 class="text-sm font-semibold">Notifications</h2>
      {#if store.unread > 0}
        <Button size="sm" variant="ghost" onclick={() => store.markAll()}>
          <CheckCheck class="size-4" aria-hidden="true" />Mark all read
        </Button>
      {/if}
    </div>
    <ul class="max-h-96 overflow-y-auto">
      {#each store.items as item (item.id)}
        <li>
          <a
            href={subjectHref(item.spaceId, item.subjectType, item.subjectId)}
            onclick={() => {
              void store.open(item)
              open = false
            }}
            class="flex gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <span
              class={item.readAt ? "invisible" : "mt-1.5 size-2 shrink-0 rounded-full bg-primary"}
              aria-hidden="true"
            ></span>
            <span class="flex-1">
              <span class={item.readAt ? "" : "font-medium"}>{describeNotification(item)}</span>
              <span class="block text-xs text-muted-foreground">{when(item.createdAt)}</span>
            </span>
            {#if !item.readAt}<span class="sr-only">Unread</span>{/if}
          </a>
        </li>
      {:else}
        <li class="px-3 py-6 text-center text-sm text-muted-foreground">You are all caught up.</li>
      {/each}
    </ul>
  </Popover.Content>
</Popover.Root>
