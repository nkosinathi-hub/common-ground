<script lang="ts">
  import { Star } from "@lucide/svelte"
  import { demoTitles } from "./demo-data"
  interface Props {
    selected: number
    query: string
    onSelect: (index: number) => void
  }
  let { selected, query, onSelect }: Props = $props()
  let filtered = $derived(
    demoTitles
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.name.toLowerCase().includes(query.toLowerCase())),
  )
</script>

<section class="rounded-2xl border bg-card p-4">
  <h2 class="mb-3 font-semibold">
    Titles you share <span class="text-sm font-normal text-muted-foreground">· 12</span>
  </h2>
  <div class="grid gap-2">
    {#each filtered as entry (entry.item.name)}<button
        type="button"
        class="flex items-center gap-3 rounded-xl border p-3 text-left {selected === entry.index
          ? 'border-primary/40 bg-primary/5'
          : 'hover:bg-muted/50'}"
        onclick={() => onSelect(entry.index)}
        ><span class="grid size-14 place-items-center rounded-lg text-2xl {entry.item.colour}"
          >{entry.item.art}</span
        ><span class="min-w-0 flex-1"
          ><span class="block font-medium">{entry.item.name}</span><span
            class="block text-xs text-muted-foreground"
            >{entry.item.kind} · {entry.item.year} · <Star class="inline size-3" />{entry.item
              .rating}</span
          ><span class="mt-1 block text-xs text-primary"
            >{entry.index === 0 ? "S2 · E4 · Continue watching" : "On your watchlist"}</span
          ></span
        ></button
      >{/each}
  </div>
</section>
