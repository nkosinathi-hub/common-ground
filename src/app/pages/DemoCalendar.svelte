<script lang="ts">
  import { ChevronLeft, ChevronRight } from "@lucide/svelte"
  import { demoEvents } from "./demo-data"
  interface Props {
    onAction: (action: string) => void
  }
  let { onAction }: Props = $props()
</script>

<div class="mb-5 flex items-center justify-between rounded-xl border bg-card p-4">
  <div>
    <p class="font-semibold">October 2026</p>
    <p class="mt-1 text-sm text-muted-foreground">A few good things on the horizon</p>
  </div>
  <div class="flex gap-2">
    <button type="button" class="rounded-lg border px-3 py-2 text-sm">Today</button><button
      type="button"
      class="grid size-9 place-items-center rounded-lg border"
      aria-label="Previous month"><ChevronLeft class="size-4" /></button
    ><button
      type="button"
      class="grid size-9 place-items-center rounded-lg border"
      aria-label="Next month"><ChevronRight class="size-4" /></button
    >
  </div>
</div>
<div class="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
  <section class="rounded-2xl border bg-card p-5">
    <div class="mb-4 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
      {#each ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as day (day)}<span>{day}</span
        >{/each}
    </div>
    <div class="grid grid-cols-7 gap-1">
      {#each Array.from({ length: 35 }, (_, i) => i + 1) as day (day)}<button
          type="button"
          class="relative aspect-square rounded-lg text-sm hover:bg-muted {day === 23
            ? 'bg-primary text-primary-foreground hover:bg-primary'
            : ''}"
          onclick={() => onAction("event")}
          >{day > 31 ? day - 31 : day}{#if [23, 24, 25].includes(day)}<span
              class="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current"
            ></span>{/if}</button
        >{/each}
    </div>
  </section>
  <section class="rounded-2xl border bg-card p-5">
    <h2 class="font-semibold">Shared plans</h2>
    <p class="mt-1 text-sm text-muted-foreground">October 23–25</p>
    <div class="mt-5 space-y-4">
      {#each demoEvents as event (event.title)}<button
          type="button"
          class="flex w-full gap-3 text-left"
          onclick={() => onAction("event-detail")}
          ><span class="w-24 text-xs font-semibold text-primary">{event.date}</span><span
            class="h-12 w-1 rounded-full bg-primary/40"
          ></span><span
            ><span class="block text-sm font-medium">{event.title}</span><span
              class="mt-1 block text-xs text-muted-foreground">{event.place} · Ana and Ben</span
            ></span
          ></button
        >{/each}
    </div>
  </section>
</div>
