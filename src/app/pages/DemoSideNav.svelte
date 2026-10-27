<script lang="ts">
  import { ChevronDown, Sparkles } from "@lucide/svelte"
  import { demoNav, type DemoSection } from "./demo-data"
  interface Props {
    section: DemoSection
    onSelect: (section: DemoSection) => void
    onAbout: () => void
  }
  let { section, onSelect, onAbout }: Props = $props()
</script>

<aside class="hidden w-64 shrink-0 flex-col border-r bg-background p-5 md:flex">
  <a href="#/demo" class="mb-8 flex items-center gap-3 font-semibold"
    ><span class="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"
      ><Sparkles class="size-5" /></span
    >Common Ground</a
  >
  <div class="mb-6 flex items-center gap-3 rounded-xl border bg-card p-3">
    <span class="grid size-9 place-items-center rounded-lg bg-violet-100 text-sm font-semibold"
      >AB</span
    ><span
      ><span class="block text-sm font-medium">Ana & Ben</span><span
        class="text-xs text-muted-foreground">Sample space</span
      ></span
    ><ChevronDown class="ml-auto size-4 text-muted-foreground" />
  </div>
  <nav class="grid gap-1" aria-label="Demo sections">
    {#each demoNav as item (item.id)}<button
        type="button"
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm {section === item.id
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-muted-foreground hover:bg-muted'}"
        aria-current={section === item.id ? "page" : undefined}
        onclick={() => onSelect(item.id)}><item.icon class="size-4" />{item.label}</button
      >{/each}
  </nav>
  <div class="mt-auto rounded-xl bg-muted/70 p-4">
    <p class="text-sm font-medium">Made for your people</p>
    <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
      A shared place for what you're watching, planning and dreaming up.
    </p>
    <button
      type="button"
      class="mt-3 text-xs font-medium text-primary hover:underline"
      onclick={onAbout}>What can we do here?</button
    >
  </div>
</aside>
