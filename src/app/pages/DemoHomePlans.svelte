<script lang="ts">
  import { CalendarDays, Lightbulb } from "@lucide/svelte"
  import { demoEvents, demoIdeas } from "./demo-data"
  interface Props {
    onGo: (section: string) => void
  }
  let { onGo }: Props = $props()
</script>

<section class="rounded-2xl border bg-card p-5">
  <div class="mb-4 flex items-center justify-between">
    <div>
      <h2 class="font-semibold">Coming up</h2>
      <p class="mt-1 text-sm text-muted-foreground">The next few days</p>
    </div>
    <CalendarDays class="size-5 text-primary" />
  </div>
  {#each demoEvents.slice(0, 2) as event (event.title)}<button
      type="button"
      class="flex w-full gap-3 py-2 text-left"
      onclick={() => onGo("calendar")}
      ><span class="w-28 text-xs font-medium text-primary">{event.date}</span><span
        ><span class="block text-sm font-medium">{event.title}</span><span
          class="text-xs text-muted-foreground">{event.place}</span
        ></span
      ></button
    >{/each}
</section>
<section class="rounded-2xl border bg-card p-5">
  <div class="mb-4 flex items-center justify-between">
    <div>
      <h2 class="font-semibold">Ideas in the making</h2>
      <p class="mt-1 text-sm text-muted-foreground">Little sparks, shared plans</p>
    </div>
    <Lightbulb class="size-5 text-primary" />
  </div>
  {#each demoIdeas.slice(0, 2) as idea (idea.title)}<button
      type="button"
      class="flex w-full justify-between gap-3 py-2 text-left"
      onclick={() => onGo("ideas")}
      ><span class="font-medium">{idea.emoji} {idea.title}</span><span
        class="rounded-full bg-muted px-2 py-1 text-xs">{idea.stage}</span
      ></button
    >{/each}
</section>
