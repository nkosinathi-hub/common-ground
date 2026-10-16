<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { cn } from "$lib/utils"
  import { describeNotification, subjectHref, type Notification } from "../domain/notification"
  import { useNotifications } from "./context"

  interface Props {
    onFollow: (item: Notification) => void
    class?: string
  }

  let { onFollow, class: className }: Props = $props()
  const { store } = useNotifications()
  const when = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
</script>

{#if store.error}
  <div role="alert" class="flex items-center justify-between gap-2 border-b px-3 py-2 text-sm">
    <span class="text-destructive">{store.error.message}</span>
    <Button size="sm" variant="ghost" onclick={() => store.refresh()}>Try again</Button>
  </div>
{/if}
<ul class={cn("overflow-y-auto", className)}>
  {#each store.items as item (item.id)}
    <li>
      <a
        href={subjectHref(item.spaceId, item.subjectType, item.subjectId, item.type)}
        onclick={() => onFollow(item)}
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
