<script lang="ts">
  import { untrack } from "svelte"
  import { History } from "@lucide/svelte"
  import { formatDay, type Cursor } from "@/shared/domain"
  import { EmptyState, ErrorState, Loading, LoadMore, PagedList, InitialAvatar } from "@/shared/ui"
  import { describeActivity, type ActivityEvent } from "../domain/notification"
  import { useNotifications } from "./context"

  interface Props {
    spaceId: string
    /** Show only the latest few, without paging, for the home page. */
    limit?: boolean
  }

  const LATEST = 6

  let { spaceId, limit = false }: Props = $props()
  const { service } = useNotifications()
  const list = new PagedList<ActivityEvent, Cursor>((after) =>
    service.activityIn(spaceId, after, limit ? LATEST : undefined),
  )
  $effect(() => {
    void spaceId
    untrack(() => void list.load())
  })
</script>

{#if list.items.length > 0}
  <!-- Figma List row with an avatar: who did what, and when. -->
  <ol class="flex flex-col">
    {#each list.items as event (event.id)}
      <li class="flex items-center gap-item py-item">
        <InitialAvatar name={event.byMe ? "You" : (event.actorName ?? "?")} decorative />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="type-label text-foreground">{describeActivity(event)}</span>
          <time class="type-xs text-muted-foreground" datetime={event.createdAt}>
            {formatDay(event.createdAt)}
          </time>
        </span>
      </li>
    {/each}
  </ol>
  {#if !limit}<LoadMore {list} label="Show older" />{/if}
{:else if list.error}
  <ErrorState error={list.error} onRetry={() => list.load()} />
{:else if list.loading}
  <Loading label="Gathering recent activity" />
{:else}
  <EmptyState
    icon={History}
    title="Nothing yet"
    description="What you and your people do here shows up as it happens."
  />
{/if}
