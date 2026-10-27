<script lang="ts">
  import { Check, Heart, Play, Star } from "@lucide/svelte"
  import { demoEpisodes, demoTitles } from "./demo-data"
  interface Props {
    selected: number
    onAction: (action: string) => void
  }
  let { selected, onAction }: Props = $props()
  let episode = $state(3)
  let title = $derived(demoTitles[selected]!)
</script>

<section class="overflow-hidden rounded-2xl border bg-card">
  <div
    class="grid min-h-40 place-items-center bg-gradient-to-br from-amber-100 to-sky-100 text-6xl"
  >
    {title.art}
  </div>
  <div class="p-5">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {title.kind} · {title.year}
        </p>
        <h2 class="mt-1 text-2xl font-semibold">{title.name}</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          <Star class="mr-1 inline size-3.5 text-amber-500" />{title.rating} · Ana & Ben collection
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg border p-2"
        aria-label="Recommend title"
        onclick={() => onAction("recommend")}><Heart class="size-4" /></button
      >
    </div>
    <p class="mt-4 text-sm leading-relaxed text-muted-foreground">
      A warm story about finding your people, showing up for each other and being a little braver
      than you thought you could be.
    </p>
    <div class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        onclick={() => onAction("play")}
        ><Play class="size-4" />Play {title.kind === "Series" ? "next episode" : "movie"}</button
      ><button
        type="button"
        class="rounded-lg border px-4 py-2.5 text-sm"
        onclick={() => onAction("trailer")}>Watch trailer</button
      >
    </div>
    {#if title.kind === "Series"}<div class="mt-5 border-t pt-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Episodes</h3>
          <label class="flex items-center gap-2 text-sm text-muted-foreground"
            >Season <select
              class="rounded-lg border bg-background px-2 py-1.5 text-foreground"
              aria-label="Season"
              ><option>Season 2</option><option>Season 1</option><option>Season 3</option></select
            ></label
          >
        </div>
        <div class="mt-3 divide-y rounded-xl border">
          {#each demoEpisodes as ep, i (ep.name)}<button
              type="button"
              class="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/40"
              onclick={() => (episode = i)}
              ><span
                class="grid size-8 place-items-center rounded-full {ep.watched
                  ? 'bg-emerald-100 text-emerald-800'
                  : episode === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'}"
                >{#if ep.watched}<Check class="size-4" />{:else}{i + 1}{/if}</span
              ><span class="flex-1"
                ><span class="block text-sm font-medium">{ep.name}</span><span
                  class="text-xs text-muted-foreground">Episode {i + 1} · {ep.duration}</span
                ></span
              >{#if episode === i}<span class="text-xs text-primary">Selected</span>{/if}</button
            >{/each}
        </div>
      </div>{/if}
  </div>
</section>
