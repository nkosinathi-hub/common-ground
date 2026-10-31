<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { cn } from "$lib/utils"
  import { formatDateTime } from "@/shared/domain"
  import { LoadMore, InitialAvatar } from "@/shared/ui"
  import { describeNotification, subjectHref, type Notification } from "../domain/notification"
  import { useNotifications } from "./context"

  interface Props {
    onFollow: (item: Notification) => void
    class?: string
  }

  let { onFollow, class: className }: Props = $props()
  const { store } = useNotifications()
</script>

{#if store.error}
  <div
    role="alert"
    class="flex items-center justify-between gap-related border-b border-border px-inset py-related type-sm"
  >
    <span class="text-destructive">{store.error.message}</span>
    <Button size="sm" variant="ghost" onclick={() => store.refresh()}>Try again</Button>
  </div>
{/if}
<!-- No frame: one row per notification, unread ones dotted and bold, each opening its subject. -->
<ul class={cn("flex flex-col divide-y divide-border overflow-y-auto", className)}>
  {#each store.items as item (item.id)}
    <li>
      <a
        href={subjectHref(item.spaceId, item.subjectType, item.subjectId, item.type)}
        onclick={() => onFollow(item)}
        class="flex gap-item px-inset py-item type-sm outline-none hover:bg-muted focus-visible:bg-muted"
      >
        <span
          class={item.readAt ? "invisible" : "mt-1.5 size-2 shrink-0 rounded-full bg-primary"}
          aria-hidden="true"
        ></span>
        <InitialAvatar name={item.actorName ?? "?"} size="sm" decorative />
        <span class="flex-1">
          <span class={item.readAt ? "text-foreground" : "type-label text-foreground"}
            >{describeNotification(item)}</span
          >
          <span class="block type-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
        </span>
        {#if !item.readAt}<span class="sr-only">Unread</span>{/if}
      </a>
    </li>
  {:else}
    <li class="px-inset py-section text-center type-sm text-muted-foreground">
      You are all caught up.
    </li>
  {/each}
</ul>
<LoadMore list={store.list} label="Show older" />
