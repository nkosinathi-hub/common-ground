<script lang="ts">
  interface Props {
    /** Month view (D12) or the agenda (D13); each has its own headline. */
    month: boolean
    spaceName: string
  }

  let { month, spaceName }: Props = $props()
</script>

<!-- The page keeps its headline; the shared shell places the New event action. -->
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
</header>
