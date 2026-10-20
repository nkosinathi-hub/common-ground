<script lang="ts">
  import type { MemberRef } from "@/shared/domain"
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

{#if summary.together || summary.people.length > 0}
  <span class="flex flex-wrap items-center gap-1 text-[11px] leading-4">
    {#if summary.together}
      <span class="rounded-full bg-primary/10 px-1.5 font-medium text-primary"
        >Together {summary.together}</span
      >
    {/if}
    {#each summary.people as person (person.name)}
      <span
        class="rounded-full border px-1.5 text-muted-foreground"
        class:border-primary={person.ahead}
        aria-label={`${person.name} is at ${person.label}${person.ahead ? ", ahead of together" : ""}`}
        >{person.name.split(" ")[0]} {person.label}</span
      >
    {/each}
  </span>
{/if}
