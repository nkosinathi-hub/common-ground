<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { ExternalLink, Trash2 } from "@lucide/svelte"
  import type { AppError } from "@/shared/domain"
  import type { Idea, ResearchLink } from "../domain"
  import { useResearch } from "./context"
  import ListFooter from "./ListFooter.svelte"
  import { PagedList } from "./paged-list.svelte"

  let { idea }: { idea: Idea } = $props()
  const research = useResearch()
  const list = new PagedList<ResearchLink>((after) => research.links(idea.id, after))
  $effect(() => void list.load())

  let draft = $state({ url: "", title: "", description: "" })
  let error = $state<AppError | null>(null)

  async function add(event: SubmitEvent) {
    event.preventDefault()
    error = await list.add(research.addLink(idea.spaceId, idea.id, draft))
    if (!error) draft = { url: "", title: "", description: "" }
  }
  const invalid = (field: string) => (error?.field === field ? true : undefined)
</script>

<section aria-labelledby="links-heading" class="flex flex-col gap-3">
  <h2 id="links-heading" class="text-lg font-semibold">Research links</h2>
  <form class="grid gap-2 sm:grid-cols-2" onsubmit={add}>
    <Input
      aria-label="Link URL"
      type="url"
      placeholder="https://"
      bind:value={draft.url}
      aria-invalid={invalid("url")}
    />
    <Input
      aria-label="Link title"
      placeholder="Title"
      maxlength={200}
      bind:value={draft.title}
      aria-invalid={invalid("title")}
    />
    <Input
      aria-label="Link description"
      class="sm:col-span-2"
      placeholder="Why it matters (optional)"
      maxlength={2000}
      bind:value={draft.description}
    />
    {#if error}<p class="text-sm text-destructive sm:col-span-2" role="alert">
        {error.message}
      </p>{/if}
    <Button type="submit" size="sm" class="self-start">Add link</Button>
  </form>
  <ul class="flex flex-col gap-2">
    {#each list.items as link (link.id)}
      <li
        class="flex items-start justify-between gap-2 rounded-lg border p-3"
        data-testid="research-link"
      >
        <div class="min-w-0">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            class="inline-flex items-center gap-1 font-medium hover:underline"
            >{link.title}<ExternalLink class="size-3" /></a
          >
          <p class="truncate text-xs text-muted-foreground">{link.url}</p>
          {#if link.description}<p class="text-sm">{link.description}</p>{/if}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete link {link.title}"
          onclick={() => list.remove(link.id, research.removeLink(link.id))}><Trash2 /></Button
        >
      </li>
    {/each}
  </ul>
  <ListFooter {list} empty="No links yet." />
</section>
