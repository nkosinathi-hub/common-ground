<script lang="ts">
  import { ChevronRight, MessageCircle } from "@lucide/svelte"
  import { demoTitles } from "./demo-data"
  import DemoHomePlans from "./DemoHomePlans.svelte"
  interface Props {
    onGo: (section: string) => void
  }
  let { onGo }: Props = $props()
</script>

<section
  class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-violet-100/60 p-6 md:p-9"
>
  <div class="relative z-[1] max-w-2xl">
    <p class="text-sm font-medium text-primary">Friday, 23 October</p>
    <h2 class="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Good evening, Ana.</h2>
    <p class="mt-3 leading-relaxed text-muted-foreground">
      Your shared space is ready whenever you are. Pick up where you left off or make a new plan
      together.
    </p>
    <div class="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        onclick={() => onGo("watch")}>Choose something to watch</button
      ><button
        type="button"
        class="rounded-lg border bg-background/80 px-4 py-2.5 text-sm font-medium"
        onclick={() => onGo("ideas")}>Explore your ideas</button
      >
    </div>
  </div>
</section>
<div class="mt-6 grid gap-5 lg:grid-cols-2">
  <section class="rounded-2xl border bg-card p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="font-semibold">Continue watching</h2>
        <p class="mt-1 text-sm text-muted-foreground">Pick up a story you share</p>
      </div>
      <button type="button" class="text-sm font-medium text-primary" onclick={() => onGo("watch")}
        >Watchlist</button
      >
    </div>
    {#each demoTitles.slice(0, 2) as title (title.name)}<button
        type="button"
        class="mb-2 flex w-full items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted/40"
        onclick={() => onGo("watch")}
        ><span class="grid size-12 place-items-center rounded-lg text-xl {title.colour}"
          >{title.art}</span
        ><span class="flex-1"
          ><span class="block font-medium">{title.name}</span><span
            class="text-xs text-muted-foreground">S2 · E4 · Continue watching</span
          ></span
        ><ChevronRight class="size-4 text-muted-foreground" /></button
      >{/each}
  </section>
  <section class="rounded-2xl border bg-card p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="font-semibold">A note for you</h2>
        <p class="mt-1 text-sm text-muted-foreground">From Ben · Yesterday</p>
      </div>
      <span class="grid size-10 place-items-center rounded-full bg-sky-100 font-semibold">B</span>
    </div>
    <p class="leading-relaxed">The new episode was so good. Let's save the next one for Friday?</p>
    <button
      type="button"
      class="mt-4 text-sm font-medium text-primary"
      onclick={() => onGo("notes")}
      ><MessageCircle class="mr-2 inline size-4" />Read conversation · 2 replies</button
    >
  </section>
  <DemoHomePlans {onGo} />
</div>
