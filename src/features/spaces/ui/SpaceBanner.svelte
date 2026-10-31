<script lang="ts">
  import { formatLongDay } from "@/shared/domain"
  import type { Space } from "../domain/space"
  import { templateFor } from "../domain/templates"
  import { useSpaces } from "./context"

  /** The Home welcome (D01): the day, the greeting as the page's heading, and the tagline. */
  interface Props {
    space: Space
    title: string
  }

  let { space, title }: Props = $props()
  const { store } = useSpaces()
  const cover = $derived(store.mediaUrl(space.coverPath))
  const template = $derived(templateFor(space.template))
  const line = $derived(space.tagline || `${template.headline} ${template.welcome}`)
</script>

<section data-testid="space-banner" class="flex flex-col gap-stack">
  <!-- The space's cover, when it has one, fills a wide strip above the greeting. -->
  {#if cover}<img src={cover} alt="" class="h-36 w-full rounded-lg object-cover md:h-44" />{/if}
  <div class="flex flex-col gap-related">
    <p class="type-overline text-muted-foreground">{formatLongDay(new Date())}</p>
    <h1 class="type-h1 text-foreground">{title}</h1>
    <p class="type-body text-muted-foreground">{line}</p>
  </div>
</section>
