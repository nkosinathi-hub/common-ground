<script lang="ts">
  import { Bell, ChevronDown, Search } from "@lucide/svelte"
  interface Props {
    query: string
    onQuery: (query: string) => void
    onAction: (action: string) => void
  }
  let { query, onQuery, onAction }: Props = $props()
</script>

<header
  class="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-8"
>
  <div class="min-w-0 flex-1 md:hidden">
    <p class="text-sm font-semibold">Common Ground</p>
    <p class="text-xs text-muted-foreground">Ana & Ben · Demo</p>
  </div>
  <label
    class="hidden max-w-sm flex-1 items-center gap-2 rounded-lg border bg-muted/30 px-3 md:flex"
    ><Search class="size-4 text-muted-foreground" /><input
      class="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      placeholder="Search sample titles"
      aria-label="Search sample titles"
      value={query}
      oninput={(event) => onQuery(event.currentTarget.value)}
    /></label
  >
  <button
    type="button"
    class="grid size-9 place-items-center rounded-lg border bg-background text-muted-foreground hover:bg-muted"
    aria-label="Notifications"
    onclick={() => onAction("notifications")}><Bell class="size-4" /></button
  >
  <button
    type="button"
    class="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted"
    aria-label="Open account menu"
    onclick={() => onAction("account")}
    ><span class="grid size-8 place-items-center rounded-full bg-rose-100 text-xs font-semibold"
      >A</span
    ><span class="hidden text-sm md:inline">Ana</span><ChevronDown class="size-3.5" /></button
  >
</header>
