<script lang="ts">
  import { setMode, userPrefersMode } from "mode-watcher"
  import * as Card from "$lib/components/ui/card"
  import { Label } from "$lib/components/ui/label"
  import * as RadioGroup from "$lib/components/ui/radio-group"

  type Choice = "light" | "dark" | "system"
  const CHOICES: { value: Choice; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "Match this device" },
  ]
  const isChoice = (value: string): value is Choice => CHOICES.some((c) => c.value === value)
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Appearance</Card.Title>
    <Card.Description>Light or dark, for this device only.</Card.Description>
  </Card.Header>
  <Card.Content>
    <RadioGroup.Root
      aria-label="Appearance"
      value={userPrefersMode.current}
      onValueChange={(value) => isChoice(value) && setMode(value)}
    >
      {#each CHOICES as choice (choice.value)}
        <div class="flex items-center gap-2">
          <RadioGroup.Item value={choice.value} id={`appearance-${choice.value}`} />
          <Label for={`appearance-${choice.value}`}>{choice.label}</Label>
        </div>
      {/each}
    </RadioGroup.Root>
  </Card.Content>
</Card.Root>
