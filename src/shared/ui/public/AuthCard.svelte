<script lang="ts">
  import { ArrowLeft } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import TextLink from "../TextLink.svelte"

  interface Props {
    /** The page's h1, drawn as heading/h2. */
    title: string
    description?: string
    backHref?: string
    backLabel?: string
    children: Snippet
    footer?: Snippet
  }

  let { title, description, backHref, backLabel = "Back", children, footer }: Props = $props()
</script>

<!-- Figma Auth card (211:8929): 480 wide, 32 inside. -->
<section
  class="flex w-full max-w-auth flex-col gap-stack rounded-lg border border-border bg-card p-card-auth"
>
  {#if backHref}<TextLink href={backHref} icon={ArrowLeft} class="-my-1 w-fit flex-row-reverse"
      >{backLabel}</TextLink
    >{/if}
  <div class="flex flex-col gap-related">
    <h1 class="type-h2 text-foreground">{title}</h1>
    {#if description}<p class="type-sm text-muted-foreground">{description}</p>{/if}
  </div>
  {@render children()}
  {#if footer}<div class="flex flex-col gap-related type-sm text-muted-foreground">
      {@render footer()}
    </div>{/if}
</section>
