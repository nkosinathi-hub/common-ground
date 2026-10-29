<script lang="ts" module>
  export type ThumbKind =
    | "solid"
    | "gradient"
    | "pattern"
    | "image"
    | "filled"
    | "light"
    | "square"
    | "soft"
    | "rounded"
    | "serif"
    | "sans"
</script>

<script lang="ts">
  import { ImageIcon } from "@lucide/svelte"
  import { cn } from "$lib/utils"

  interface Props {
    kind: ThumbKind
    /** The background picture, for the image tile; an image icon until there is one. */
    picture?: string | null
  }

  let { kind, picture = null }: Props = $props()
  const backgrounds: Partial<Record<ThumbKind, string>> = {
    gradient:
      "background: linear-gradient(180deg, var(--background), color-mix(in oklab, var(--primary) 12%, var(--background)))",
    pattern:
      "background-image: radial-gradient(color-mix(in oklab, var(--primary) 16%, transparent) 1px, transparent 1px); background-size: 8px 8px",
  }
</script>

<!-- Figma Thumb/* (229:7806 to 229:7931): each option drawn with the real tokens. -->
<span
  aria-hidden="true"
  data-radius={["square", "soft", "rounded"].includes(kind) ? kind : undefined}
  class="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-sm border border-border bg-background"
  style={backgrounds[kind]}
>
  {#if kind === "image"}
    {#if picture}<img src={picture} alt="" class="absolute inset-0 size-full object-cover" />{:else}
      <ImageIcon class="size-5 text-muted-foreground" />{/if}
  {:else if kind === "filled" || kind === "light"}
    <span
      class={cn(
        "absolute inset-y-0 left-0 w-6",
        kind === "filled" ? "bg-primary" : "border-r border-border bg-card",
      )}
    ></span>
    <span class="ml-6 h-6 w-12 rounded-sm border border-border bg-card"></span>
  {:else if kind === "square" || kind === "soft" || kind === "rounded"}
    <span class="flex h-10 w-18 items-center gap-1 rounded-lg border border-border bg-card px-1.5">
      <span class="h-4 w-6 rounded-md bg-primary"></span><span
        class="h-1 w-6 rounded-full bg-muted-foreground/40"
      ></span>
    </span>
  {:else if kind === "serif" || kind === "sans"}
    <span class={cn("type-h2 text-foreground", kind === "serif" ? "font-serif" : "font-sans")}
      >Aa</span
    >
  {:else}
    <span class="h-6 w-12 rounded-sm border border-border bg-card"></span>
  {/if}
</span>
