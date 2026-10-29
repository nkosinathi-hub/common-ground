<script lang="ts">
  import { mode } from "mode-watcher"
  import { Button } from "$lib/components/ui/button"
  import { cn } from "$lib/utils"
  import { paletteFor } from "../../domain/palette"
  import type { SpaceLook } from "../../domain/space-look"

  interface Props {
    look: SpaceLook
    name: string
    picture: string | null
  }

  let { look, name, picture }: Props = $props()
  const scheme = $derived(mode.current === "dark" ? "dark" : "light")
  // The same variables and attributes the shell applies, scoped to this box.
  const style = $derived(
    [
      ...Object.entries(paletteFor(look, scheme).vars),
      ["--heading-font", look.headings === "sans" ? "var(--font-sans)" : "var(--font-serif)"],
    ]
      .map(([key, value]) => `${key}: ${value}`)
      .join("; "),
  )
  const background = $derived(
    look.backgroundStyle === "image" && !picture ? "solid" : look.backgroundStyle,
  )
</script>

<!-- Figma Look preview (230:7804): a small space drawn with the chosen look. -->
<div
  data-testid="look-preview"
  data-density={look.density}
  data-radius={look.corners}
  {style}
  class="flex h-50 overflow-hidden rounded-lg border border-border bg-background text-foreground"
  aria-hidden="true"
>
  <div
    class={cn(
      "flex w-14 flex-col gap-related px-2.5 py-item",
      look.sidebar === "filled" ? "bg-sidebar" : "border-r border-border bg-card",
    )}
  >
    <span class="size-4 rounded-sm bg-brand"></span>
    <span
      class="mt-1 h-2.5 w-9 rounded-sm {look.sidebar === 'filled'
        ? 'bg-sidebar-foreground'
        : 'bg-primary'}"
    ></span>
    {#each [0, 1, 2] as row (row)}<span
        class="h-1 w-7 rounded-full {look.sidebar === 'filled'
          ? 'bg-sidebar-foreground/60'
          : 'bg-muted-foreground/40'}"
      ></span>{/each}
  </div>
  <div
    class="relative flex flex-1 flex-col gap-item p-inset"
    style:background-image={background === "gradient"
      ? "linear-gradient(180deg, var(--background), color-mix(in oklab, var(--primary) 12%, var(--background)))"
      : background === "pattern"
        ? "radial-gradient(color-mix(in oklab, var(--primary) 16%, transparent) 1px, transparent 1px)"
        : background === "image"
          ? `linear-gradient(rgb(26 20 46 / 0.35), rgb(26 20 46 / 0.35)), url("${picture}")`
          : undefined}
    style:background-size={background === "pattern" ? "8px 8px" : "cover"}
    style:background-position="{look.focusX}% {look.focusY}%"
  >
    <span
      class="relative type-h3 {background === 'image' ? 'text-white' : ''}"
      style:font-family="var(--heading-font)">{name}</span
    >
    <div class="relative flex flex-col gap-related rounded-lg border border-border bg-card p-item">
      <span class="type-label">Movie night</span>
      <span class="type-xs text-muted-foreground">Friday, 8 pm</span>
      <Button size="sm" class="w-fit" tabindex={-1}>Add idea</Button>
    </div>
  </div>
</div>
