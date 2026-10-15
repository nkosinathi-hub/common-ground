<script lang="ts">
  import { History } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { AppError, Cursor } from "@/shared/domain"
  import { EmptyState, ErrorState, Loading } from "@/shared/ui"
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
  let items = $state<ActivityEvent[]>([])
  let next = $state<Cursor | null>(null)
  let error = $state<AppError | null>(null)
  let loading = $state(true)

  async function load(after: Cursor | null) {
    const page = await service.activityIn(spaceId, after)
    loading = false
    if (!page.ok) {
      error = page.error
      return
    }
    error = null
    items = after ? [...items, ...page.value.items] : [...page.value.items]
    next = page.value.next
  }
  $effect(() => void load(null))
  const shown = $derived(limit ? items.slice(0, LATEST) : items)
</script>

{#if loading}
  <Loading label="Gathering recent activity" />
{:else if error}
  <ErrorState {error} onRetry={() => load(null)} />
{:else if items.length === 0}
  <EmptyState
    icon={History}
    title="Nothing yet"
    description="What you and your people do here shows up as it happens."
  />
{:else}
  <ol class="grid gap-2">
    {#each shown as event (event.id)}
      <li class="flex justify-between gap-3 text-sm">
        <span>{describeActivity(event)}</span>
        <time class="shrink-0 text-xs text-muted-foreground" datetime={event.createdAt}>
          {new Date(event.createdAt).toLocaleDateString()}
        </time>
      </li>
    {/each}
  </ol>
  {#if next && !limit}<Button variant="outline" onclick={() => load(next)}>Show older</Button>{/if}
{/if}
