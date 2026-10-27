<script lang="ts">
  import { Check, ChevronDown, Plus } from "@lucide/svelte"
  interface Props {
    onAction: (action: string) => void
  }
  let { onAction }: Props = $props()
  let tab = $state("General")
  const tabs = ["General", "People", "Home layout", "Preferences", "Media & playback"]
</script>

<div class="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
  <nav class="grid content-start gap-1 rounded-2xl border bg-card p-3" aria-label="Settings tabs">
    {#each tabs as item (item)}<button
        type="button"
        class="rounded-lg px-3 py-2.5 text-left text-sm {tab === item
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-muted-foreground hover:bg-muted'}"
        onclick={() => (tab = item)}>{item}</button
      >{/each}
  </nav>
  <section class="rounded-2xl border bg-card p-5 md:p-7">
    <p class="text-xs font-semibold tracking-wider text-primary uppercase">{tab}</p>
    <h2 class="mt-2 text-xl font-semibold">
      {tab === "People"
        ? "The people in your space"
        : tab === "Home layout"
          ? "Make home feel like yours"
          : tab === "Media & playback"
            ? "Connect the things you use"
            : tab === "Preferences"
              ? "Your preferences"
              : "A space with your own feel"}
    </h2>
    <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
      {tab === "People"
        ? "Invite the people you want to plan and watch with. Choose what each person can manage."
        : "Change how this shared space looks and works for everyone in it."}
    </p>
    {#if tab === "People"}<div class="mt-6 divide-y rounded-xl border">
        <div class="flex items-center gap-3 p-4">
          <span class="grid size-10 place-items-center rounded-full bg-rose-100 font-semibold"
            >A</span
          ><span class="flex-1"
            ><span class="block text-sm font-medium">Ana</span><span
              class="text-xs text-muted-foreground">Owner · You</span
            ></span
          ><Check class="size-4 text-emerald-600" />
        </div>
        <div class="flex items-center gap-3 p-4">
          <span class="grid size-10 place-items-center rounded-full bg-sky-100 font-semibold"
            >B</span
          ><span class="flex-1"
            ><span class="block text-sm font-medium">Ben</span><span
              class="text-xs text-muted-foreground">Member</span
            ></span
          ><button
            type="button"
            class="text-sm text-muted-foreground"
            onclick={() => onAction("member")}>Manage</button
          >
        </div>
        <div class="p-4">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
            onclick={() => onAction("invite")}><Plus class="size-4" />Invite a person</button
          >
        </div>
      </div>
    {:else if tab === "Home layout"}<div class="mt-6 space-y-3">
        {#each ["Notes & discussion", "Continue watching", "Ideas we're growing", "Coming up"] as card, i (card)}<div
            class="flex items-center gap-3 rounded-xl border p-4"
          >
            <span class="grid size-7 place-items-center rounded-md bg-muted text-xs">{i + 1}</span
            ><span class="flex-1 text-sm font-medium">{card}</span><button
              type="button"
              class="rounded-md border px-2 py-1 text-xs"
              onclick={() => onAction("layout")}>Move</button
            >
          </div>{/each}
      </div>
    {:else}<div class="mt-6 space-y-4">
        {#each ["Space name", "Accent colour", "Who can add titles", "Default watch view"] as label, i (label)}<label
            class="block"
            ><span class="mb-2 block text-sm font-medium">{label}</span>{#if i === 0}<input
                class="w-full max-w-md rounded-lg border bg-background px-3 py-2.5 text-sm"
                value="Ana & Ben"
                readonly
              />{:else}<button
                type="button"
                class="flex w-full max-w-md items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-left text-sm"
                onclick={() => onAction("setting")}
                ><span class="text-muted-foreground">Choose a setting</span><ChevronDown
                  class="size-4"
                /></button
              >{/if}</label
          >{/each}
      </div>{/if}
  </section>
</div>
