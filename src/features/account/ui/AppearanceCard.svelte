<script lang="ts">
  import { setMode, userPrefersMode } from "mode-watcher"
  import { Button } from "$lib/components/ui/button"
  import { SettingsSection, toast, ViewToggle } from "@/shared/ui"

  type Choice = "light" | "dark" | "system"
  const CHOICES: { value: Choice; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ]
  let chosen = $state<Choice | null>(null)
  const current = $derived(chosen ?? userPrefersMode.current)

  function save() {
    setMode(current)
    chosen = null
    toast.success("Saved")
  }
</script>

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
