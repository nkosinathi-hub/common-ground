<script lang="ts">
  import { Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"

  interface Props {
    /** Month view (D12) or the agenda (D13); each has its own headline. */
    month: boolean
    spaceName: string
    onNew: () => void
  }

  let { month, spaceName, onNew }: Props = $props()
</script>

<!-- D12 and D13 hero: the headline, a line under it, and the plus; phones use the FAB. -->
<header class="flex items-start justify-between gap-columns">
  <div class="flex flex-col gap-related">
    <h1 class="type-h1 text-foreground">
      {month ? "Make time for each other." : "Time, together."}
    </h1>
    <p class="type-body text-muted-foreground max-md:hidden">
      {month
        ? "Your shared plans, with room for the everyday."
        : `Everything ${spaceName} have planned, in one list.`}
    </p>
  </div>
  <Button size="icon" class="max-md:hidden" aria-label="New event" onclick={onNew}
    ><Plus aria-hidden="true" /></Button
  >
</header>
