<script lang="ts">
  import { Illustration } from "@/shared/ui"
  import type { Space } from "../domain/space"
  import { templateFor } from "../domain/templates"
  import { useSpaces } from "./context"

  /** The Home welcome: the cover picture behind a readable scrim, the title and the tagline. */
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

<section
  data-testid="space-banner"
  class="relative overflow-hidden rounded-2xl bg-banner bg-cover bg-center"
  style:background-image={cover ? `url("${cover}")` : undefined}
>
  <div
    class={[
      "flex items-center justify-between gap-6 px-6 py-8",
      cover && "m-3 w-fit max-w-[calc(100%-1.5rem)] rounded-xl bg-background/80 py-5 sm:mt-16",
    ]}
  >
    <div>
      <h1 class="text-2xl font-semibold">{title}</h1>
      <p class="mt-1 text-muted-foreground">{line}</p>
    </div>
    {#if !cover}<Illustration class="hidden h-24 shrink-0 sm:block" />{/if}
  </div>
</section>
