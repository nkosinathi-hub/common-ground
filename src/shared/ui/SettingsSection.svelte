<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    title: string
    description?: string
    /** The fields, inside one card. */
    children: Snippet
    id?: string
    /** Intro above the card at every width, for wide content such as the Look and feel rows. */
    stacked?: boolean
    /** A destructive outline, for the danger zone and leaving. */
    danger?: boolean
  }

  let { title, description, children, id, stacked = false, danger = false }: Props = $props()
  const headingId = $derived(id ? `${id}-title` : undefined)
</script>

<!-- Figma Settings section (211:4765): the intro beside the card on wide screens, above it on phones. -->
<section
  {id}
  aria-labelledby={headingId}
  class={stacked ? "flex flex-col gap-stack" : "flex flex-col gap-stack md:flex-row md:gap-section"}
>
  <div
    class={stacked
      ? "flex flex-col gap-hairline"
      : "flex flex-col gap-hairline md:w-70 md:shrink-0"}
  >
    <h2 id={headingId} class="type-h3 text-foreground">{title}</h2>
    {#if description}<p class="type-sm text-muted-foreground">{description}</p>{/if}
  </div>
  <div
    class="flex min-w-0 flex-1 flex-col gap-stack rounded-lg border bg-card p-card {danger
      ? 'border-destructive'
      : 'border-border'}"
  >
    {@render children()}
  </div>
</section>
