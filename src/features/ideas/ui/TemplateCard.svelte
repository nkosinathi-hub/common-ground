<script lang="ts">
  import { ChevronDown } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { toast } from "@/shared/ui"
  import { IDEA_TEMPLATE_OPTIONS, type Idea, type IdeaTemplate } from "../domain"
  import { useIdeas } from "./context"

  let { idea, onChange }: { idea: Idea; onChange: (idea: Idea) => void } = $props()
  const ideas = useIdeas().service
  const current = $derived(IDEA_TEMPLATE_OPTIONS.find((o) => o.id === idea.template))
  const others = $derived(IDEA_TEMPLATE_OPTIONS.filter((o) => o.id !== "blank"))

  async function choose(template: string) {
    if (template === idea.template) return
    const result = await ideas.setTemplate(idea.id, template as IdeaTemplate)
    if (!result.ok) return toast.error(result.error.message)
    onChange(result.value)
  }
</script>

<!-- D06 Template card: which fields lead the overview; changing it never deletes what is written. -->
<Card.Root role="region" aria-labelledby="template-heading">
  <Card.Header>
    <Card.Title id="template-heading">Template</Card.Title>
    <Card.Action><Badge variant="secondary">{current?.label ?? "Blank"}</Badge></Card.Action>
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    <p class="type-sm text-muted-foreground">
      {others.map((o) => `${o.label}: ${o.description}`).join(" ")}
    </p>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button {...props} variant="outline" class="self-start">
            Change template<ChevronDown aria-hidden="true" />
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start">
        <DropdownMenu.RadioGroup value={idea.template} onValueChange={choose}>
          {#each IDEA_TEMPLATE_OPTIONS as option (option.id)}
            <DropdownMenu.RadioItem value={option.id}>{option.label}</DropdownMenu.RadioItem>
          {/each}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Card.Content>
</Card.Root>
