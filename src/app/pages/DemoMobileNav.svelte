<script lang="ts">
  import { demoNav, type DemoSection } from "./demo-data"
  interface Props {
    section: DemoSection
    onSelect: (section: DemoSection) => void
  }
  let { section, onSelect }: Props = $props()
</script>

<nav
  class="fixed right-0 bottom-0 left-0 z-10 flex justify-around border-t bg-background px-2 py-2 md:hidden"
  aria-label="Demo sections mobile"
>
  {#each demoNav.slice(0, 5) as item (item.id)}<button
      type="button"
      class="flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] {section ===
      item.id
        ? 'font-medium text-primary'
        : 'text-muted-foreground'}"
      onclick={() => onSelect(item.id)}
      ><item.icon class="size-4" />{item.id === "notes" ? "Notes" : item.label}</button
    >{/each}
</nav>
