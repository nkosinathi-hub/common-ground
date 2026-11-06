<script lang="ts">
  import { ListVideo } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { PageTool, usePageActions } from "@/shared/ui"
  import EpisodeRows from "./EpisodeRows.svelte"
  import { useTitlePlayback } from "./title-playback.svelte"

  const playback = useTitlePlayback()
  const actions = usePageActions()
  const choices = $derived(playback?.choices)
  const id = $props.id()
  let section = $state<HTMLElement>(),
    heading = $state<HTMLHeadingElement>()
  function reveal() {
    section?.scrollIntoView({ block: "start" })
    heading?.focus({ preventScroll: true })
  }
</script>

{#if playback?.episodic && choices}
  {#if actions}<PageTool label="Episodes" icon={ListVideo} order={10} onclick={reveal} />{/if}
  <section
    bind:this={section}
    aria-labelledby={`${id}-heading`}
    class="flex scroll-mt-28 flex-col gap-item"
  >
    <div class="flex flex-wrap items-center justify-between gap-item">
      <h2
        bind:this={heading}
        id={`${id}-heading`}
        tabindex="-1"
        class="type-h2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Episodes
      </h2>
      {#if choices.seasons.length}
        <label class="sr-only" for={`${id}-season`}>Season</label>
        <NativeSelect
          id={`${id}-season`}
          value={String(choices.selectedSeason)}
          class="max-w-48"
          onchange={(event) =>
            void choices.selectSeason(playback.target(), Number(event.currentTarget.value))}
        >
          {#each choices.seasons as season (season.number)}
            <option value={String(season.number)}>{season.name}</option>
          {/each}
        </NativeSelect>
      {/if}
    </div>
    {#if choices.detailsLoading || choices.seasonLoading}
      <p role="status" class="type-sm text-muted-foreground">Loading episodes…</p>
    {:else if choices.error}
      <div class="flex flex-wrap items-center gap-item">
        <p role="alert" class="type-sm text-destructive">{choices.error}</p>
        <Button variant="outline" onclick={() => void playback.load()}>Retry episodes</Button>
      </div>
    {:else if !choices.episodes.length}
      <p class="type-sm text-muted-foreground">No episodes are listed for this season yet.</p>
    {:else}
      <EpisodeRows {playback} onpick={(episode) => void playback.playEpisode(episode)} />
    {/if}
  </section>
{/if}
