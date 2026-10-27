<script lang="ts">
  import { MessageCircle, Users } from "@lucide/svelte"
  import { demoIdeas } from "./demo-data"
  interface Props {
    onAction: (action: string) => void
  }
  let { onAction }: Props = $props()
  let selected = $state(0)
  let tab = $state("Overview")
</script>

<div class="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
  <div class="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
    {#each demoIdeas as idea, i (idea.title)}
      <button
        type="button"
        class="rounded-2xl border bg-card p-4 text-left {selected === i
          ? 'border-primary/40 ring-1 ring-primary/20'
          : 'hover:bg-muted/40'}"
        onclick={() => (selected = i)}
      >
        <div class="flex items-start justify-between gap-2">
          <h2 class="font-semibold">{idea.title}</h2>
          <span class="rounded-full bg-emerald-100 px-2 py-1 text-[11px] text-emerald-900"
            >{idea.stage}</span
          >
        </div>
        <div class="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span class="rounded-md bg-muted px-2 py-1">Shared idea</span><Users
            class="ml-auto size-3.5"
          />Ana · Ben
        </div>
      </button>
    {/each}
  </div>
  <section class="rounded-2xl border bg-card p-5 md:p-6">
    <p class="text-xs font-medium tracking-wider text-primary uppercase">
      {demoIdeas[selected]?.stage}
    </p>
    <h2 class="mt-2 text-2xl font-semibold">
      {demoIdeas[selected]?.title}
    </h2>
    <p class="mt-2 text-sm text-muted-foreground">A shared idea by Ana · Updated yesterday</p>
    <p class="mt-5 leading-relaxed text-muted-foreground">
      Let's make a bit of space for something we've been talking about. Collect notes, figure out
      the details, then turn it into a plan when it feels right.
    </p>
    <div class="mt-5 flex flex-wrap gap-1 border-b pb-3">
      {#each ["Overview", "Research", "Tasks", "Milestones", "Discussion"] as item (item)}<button
          type="button"
          class="rounded-lg px-3 py-2 text-sm {tab === item
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted'}"
          onclick={() => (tab = item)}>{item}</button
        >{/each}
    </div>
    {#if tab === "Discussion"}<div class="mt-5 rounded-xl bg-muted/50 p-4 text-sm">
        <strong>Ben</strong><span class="ml-2 text-xs text-muted-foreground">Yesterday</span>
        <p class="mt-2">
          I found a route that looks manageable. Let's check the weather before we book.
        </p>
        <button type="button" class="mt-3 text-primary" onclick={() => onAction("comment")}
          ><MessageCircle class="mr-1 inline size-4" />Reply</button
        >
      </div>{:else}<div class="mt-5 grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl bg-muted/50 p-4">
          <p class="text-xs text-muted-foreground">Next small step</p>
          <p class="mt-1 font-medium">Compare two weekends</p>
        </div>
        <div class="rounded-xl bg-muted/50 p-4">
          <p class="text-xs text-muted-foreground">People involved</p>
          <p class="mt-1 font-medium">Ana and Ben</p>
        </div>
      </div>
      <button
        type="button"
        class="mt-4 rounded-lg border px-3 py-2 text-sm"
        onclick={() => onAction("idea")}>Add to {tab.toLowerCase()}</button
      >{/if}
  </section>
</div>
