<script lang="ts">
  import { untrack } from "svelte"
  import { History } from "@lucide/svelte"
  import { formatDay, type Cursor } from "@/shared/domain"
  import { EmptyState, ErrorState, Loading, LoadMore, PagedList } from "@/shared/ui"
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
    untrack(() => list.load())
  })
</script>

{#if list.items.length > 0}
  <ol class="grid gap-2">
    {#each list.items as event (event.id)}
      <li class="flex justify-between gap-3 text-sm">
        <span>{describeActivity(event)}</span>
        <time class="shrink-0 text-xs text-muted-foreground" datetime={event.createdAt}>
          {formatDay(event.createdAt)}
        </time>
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
