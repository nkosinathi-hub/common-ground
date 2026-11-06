<script lang="ts">
  import { usePlayback } from "./context"
  import MediaServerSignIn from "./MediaServerSignIn.svelte"
  import { PLAYBACK_PREFERENCES, playbackPreference } from "./playback-preferences"
  const { account, device } = usePlayback()
</script>

<section
  class="flex flex-col gap-item rounded-xl border bg-card p-inset"
  aria-labelledby="playback-settings"
>
  <h2 id="playback-settings" class="type-h2">Playback</h2>
  {#each PLAYBACK_PREFERENCES as pref (pref.key)}
    <label class="flex min-h-11 items-center gap-related type-sm">
      <input
        type="checkbox"
        checked={playbackPreference(device, pref.key)}
        onchange={(event) => device.write(pref.key, String(event.currentTarget.checked))}
      />
      {pref.label}
    </label>
  {/each}
  <p class="type-sm text-muted-foreground">
    Intro skipping uses available timing data. These choices apply on this device.
  </p>
  {#if account}
    <h3 class="type-label">Your Jellyfin library</h3>
    <MediaServerSignIn {account} />
  {/if}
</section>
