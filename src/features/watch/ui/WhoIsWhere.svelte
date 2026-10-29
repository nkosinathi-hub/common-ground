<script lang="ts">
  import { Users } from "@lucide/svelte"
  import type { MemberRef } from "@/shared/domain"
  import { AvatarStack } from "@/shared/ui"
  import { placeRows } from "../domain/place-rows"
  import { describePlaces } from "../domain/places-summary"
  import type { WatchItem } from "../domain/types"

  interface Props {
    item: WatchItem
    /** Names for everyone with progress, including people who have since left. */
    names: readonly MemberRef[]
    /** The signed-in person, drawn in the brand tone. */
    me?: string
  }

  /** Three lines at most, so a card is the same height for two people or ten. */
  const LINES = 3

  let { item, names, me }: Props = $props()
  const summary = $derived(describePlaces(item.places, item.together, names))
  const rows = $derived(placeRows(summary, summary.together ? LINES - 1 : LINES))
  const lead = "flex w-10 shrink-0 items-center"
</script>

<!-- Together first, then people grouped by episode. Every line shares one leading column. -->
<ul class="flex flex-col gap-hairline">
  {#if summary.together}
    <li
      class="-mx-related flex h-7 items-center gap-related rounded-md bg-secondary px-related text-secondary-foreground"
    >
      <span class={lead}
        ><span class="flex size-6 items-center justify-center"
          ><Users class="size-4" aria-hidden="true" /></span
        ></span
      >
      <span class="flex-1 type-label-sm whitespace-nowrap">Together</span>
      <span class="type-label-sm tabular-nums">{summary.together}</span>
    </li>
  {/if}
  {#each rows as row (row.names.join())}
    <li class="flex h-7 items-center gap-related">
      <span class={lead}
        ><AvatarStack
          people={row.names.slice(0, 2).map((name, i) => ({ name, me: row.ids[i] === me }))}
          size="sm"
        /></span
      >
      <span class="min-w-0 flex-1 truncate type-xs text-foreground">
        {row.label ? row.names.join(", ") : `${row.names.length} more`}
      </span>
      {#if row.label}
        <span class="type-xs tabular-nums {row.ahead ? 'text-primary' : 'text-muted-foreground'}">
          {row.label}{#if row.ahead}<span class="sr-only">, ahead of together</span>{/if}
        </span>
      {/if}
    </li>
  {/each}
</ul>
