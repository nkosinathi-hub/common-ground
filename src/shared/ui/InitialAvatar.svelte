<script lang="ts">
  import { Avatar, AvatarFallback, AvatarImage } from "$lib/components/ui/avatar"
  import { initialOf } from "@/shared/domain"

  interface Props {
    name: string
    /** A picture URL; the initial shows until it loads, or when there is none. */
    src?: string | null
    size?: "sm" | "default" | "lg"
    /** Brand (lime) marks the signed-in person; secondary everyone else. */
    tone?: "secondary" | "brand"
    /** Decorative when the name is already written beside it. */
    decorative?: boolean
    class?: string
  }

  let {
    name,
    src,
    size = "default",
    tone = "secondary",
    decorative = false,
    class: className,
  }: Props = $props()
</script>

<Avatar {size} {tone} class={className} aria-hidden={decorative ? "true" : undefined}>
  {#if src}<AvatarImage {src} alt={decorative ? "" : name} />{/if}
  <AvatarFallback aria-label={decorative ? undefined : name}>{initialOf(name)}</AvatarFallback>
</Avatar>
