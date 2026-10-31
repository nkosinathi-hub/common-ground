<script lang="ts">
  import { setMode, userPrefersMode } from "mode-watcher"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { SettingsSection, toast, ViewToggle } from "@/shared/ui"

  type Choice = "light" | "dark" | "system"
  const CHOICES: { value: Choice; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ]
  /** A plain card that applies at once (Account, D18a); otherwise the settings section with Save. */
  let { compact = false }: { compact?: boolean } = $props()
  let chosen = $state<Choice | null>(null)
  const current = $derived(chosen ?? userPrefersMode.current)

  function save() {
    setMode(current)
    chosen = null
    toast.success("Saved")
  }
</script>

{#if compact}
  <!-- Figma D18a Appearance: the same choice, applied straight away. -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Appearance</Card.Title>
      <Card.Description>Applies to this device only.</Card.Description>
    </Card.Header>
    <Card.Content>
      <ViewToggle
        label="Theme"
        class="w-full! [&>*]:flex-1"
        value={userPrefersMode.current}
        options={CHOICES}
        onchange={setMode}
      />
    </Card.Content>
  </Card.Root>
{:else}
  <!-- Figma D16b Appearance on this device: Light, Dark or System, kept on this device only. -->
  <SettingsSection
    title="Appearance on this device"
    description="Only this device changes. Everyone else keeps their own setting."
  >
    <div class="flex flex-col gap-related">
      <span class="type-label text-foreground">Theme</span>
      <ViewToggle
        label="Theme"
        value={current}
        options={CHOICES}
        onchange={(next) => (chosen = next)}
      />
    </div>
    <div class="flex justify-end border-t border-border pt-stack">
      <Button disabled={current === userPrefersMode.current} onclick={save}>Save</Button>
    </div>
  </SettingsSection>
{/if}
