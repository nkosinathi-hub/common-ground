<script lang="ts">
  import type { Snippet } from "svelte"
  import { AuthCard, PublicLayout } from "@/shared/ui"

  interface Props {
    title: string
    description?: string
    backHref?: string
    children: Snippet
    footer?: Snippet
  }

  let { title, description, backHref, children, footer }: Props = $props()
</script>

<PublicLayout hero="Good things have a place here.">
  <AuthCard {title} {description} {backHref} {children} {footer} />
</PublicLayout>
