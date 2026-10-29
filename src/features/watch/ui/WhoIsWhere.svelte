<script lang="ts">
  import { Users } from "@lucide/svelte"
  import type { MemberRef } from "@/shared/domain"
  import { InitialAvatar } from "@/shared/ui"
  import { describePlaces } from "../domain/places-summary"
  import type { WatchItem } from "../domain/types"

  interface Props {
    item: WatchItem
    /** Names for everyone with progress, including people who have since left. */
    names: readonly MemberRef[]
  }

  let { item, names }: Props = $props()
  const summary = $derived(describePlaces(item.places, item.together, names))
</script>

<!-- Where the space is together, then each person on their own row: who is where at a glance. -->
{#if summary.together || summary.people.length > 0}
  <ul class="flex flex-col gap-hairline">
    {#if summary.together}
      <li
        class="flex items-center gap-related rounded-md bg-secondary px-related py-1 text-secondary-foreground"
      >
        <Users class="size-4 shrink-0" aria-hidden="true" />
        <span class="flex-1 type-label-sm">Together</span>
        <span class="type-label-sm tabular-nums">{summary.together}</span>
      </li>
    {/if}
    {#each summary.people as person (person.name)}
      <li class="flex items-center gap-related px-related py-0.5">
        <InitialAvatar name={person.name} size="sm" decorative />
        <span class="min-w-0 flex-1 truncate type-xs text-foreground">{person.name}</span>
        <span
          class="type-xs tabular-nums {person.ahead ? 'text-primary' : 'text-muted-foreground'}"
        >
          {person.label}{#if person.ahead}<span class="sr-only">, ahead of together</span>{/if}
        </span>
      </li>
    {/each}
  </ul>
{/if}
