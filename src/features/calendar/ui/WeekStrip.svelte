<script lang="ts">
  import { cn } from "$lib/utils"
  import { addDays, weekday, weekdayName, type WeekStart } from "../domain"
  import type { DateOnly } from "@/shared/domain"

  interface Props {
    selected: DateOnly
    weekStart: WeekStart
    onselect: (day: DateOnly) => void
  }

  let { selected, weekStart, onselect }: Props = $props()
  const first = $derived(addDays(selected, -((weekday(selected) - weekStart + 7) % 7)))
  const week = $derived(Array.from({ length: 7 }, (_, i) => addDays(first, i)))
</script>

<!-- Figma Week strip (M05): the chosen day's week, one tap to pick a day. -->
<div class="grid grid-cols-7 gap-hairline" role="group" aria-label="Week">
  {#each week as day (day)}
    <button
      type="button"
      aria-pressed={day === selected}
      aria-label={weekdayName(day, "long") + " " + Number(day.slice(8))}
      class={cn(
        "flex flex-col items-center gap-hairline rounded-md py-related outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
        day === selected ? "bg-primary text-primary-foreground" : "text-foreground",
      )}
      onclick={() => onselect(day)}
    >
      <span class="type-xs {day === selected ? '' : 'text-muted-foreground'}"
        >{weekdayName(day, "short")}</span
      >
      <span class="type-label">{Number(day.slice(8))}</span>
    </button>
  {/each}
</div>
