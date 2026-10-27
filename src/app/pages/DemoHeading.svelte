<script lang="ts">
  import { Plus } from "@lucide/svelte"
  import type { DemoSection } from "./demo-data"
  interface Props {
    section: DemoSection
    title: string
    onAdd: () => void
  }
  let { section, title, onAdd }: Props = $props()
</script>

<div class="mb-7 flex flex-wrap items-end justify-between gap-4">
  <div>
    <p class="mb-1 text-xs font-semibold tracking-[0.16em] text-primary uppercase">Ana & Ben</p>
    <h1 class="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
  </div>
  <button
    type="button"
    class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
    onclick={onAdd}
    ><Plus class="size-4" />{section === "calendar"
      ? "New event"
      : section === "ideas"
        ? "New idea"
        : section === "notes"
          ? "Write a note"
          : "Invite someone"}</button
  >
</div>
