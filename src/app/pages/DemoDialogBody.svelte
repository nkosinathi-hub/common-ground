<script lang="ts">
  import { Play } from "@lucide/svelte"
  interface Props {
    kind: string
    onClose: () => void
  }
  let { kind, onClose }: Props = $props()
  let isPlayer = $derived(kind === "play" || kind === "trailer")
  let hasForm = $derived(["event", "note", "comment", "idea", "invite"].includes(kind))
</script>

{#if isPlayer}<div
    class="mt-5 grid aspect-video place-items-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-center text-white"
  >
    <div>
      <span
        class="mx-auto grid size-14 place-items-center rounded-full border border-white/30 bg-white/10"
        ><Play class="size-6 fill-current" /></span
      >
      <p class="mt-3 text-sm font-medium">Sample player</p>
      <p class="mt-1 text-xs text-white/60">Example playback dialog</p>
    </div>
  </div>
{:else if hasForm}<div class="mt-5 grid gap-4">
    <label class="grid gap-2 text-sm font-medium"
      >{kind === "event"
        ? "Event name"
        : kind === "idea"
          ? "Idea name"
          : kind === "invite"
            ? "Email address"
            : "Your note"}<input
        class="rounded-lg border bg-background px-3 py-2.5 font-normal"
        placeholder={kind === "invite" ? "name@example.com" : "Add a title"}
      /></label
    ><label class="grid gap-2 text-sm font-medium"
      >Details<textarea
        class="min-h-24 rounded-lg border bg-background px-3 py-2.5 font-normal"
        placeholder="A few more details…"></textarea></label
    >{#if kind === "event"}<label class="grid gap-2 text-sm font-medium"
        >When<input
          class="rounded-lg border bg-background px-3 py-2.5 font-normal"
          type="datetime-local"
        /></label
      >{/if}
  </div>
{:else if kind === "thread"}<div class="mt-5 space-y-3 rounded-xl bg-muted/40 p-4">
    <p class="text-sm">
      <strong>Ben</strong><span class="ml-2 text-xs text-muted-foreground">Yesterday</span><span
        class="mt-1 block">Yes! Friday works for me. I'll bring snacks.</span
      >
    </p>
    <p class="text-sm">
      <strong>Ana</strong><span class="ml-2 text-xs text-muted-foreground">Today</span><span
        class="mt-1 block">Perfect. Adding it to our plan.</span
      >
    </p>
    <input
      class="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
      placeholder="Write a reply…"
    />
  </div>
{:else}<div class="mt-5 rounded-xl bg-muted/50 p-4 text-sm">
    Ana and Ben share this space. Explore the sections to see how their watchlist, plans and
    conversations fit together.
  </div>{/if}
<div class="mt-6 flex justify-end gap-2">
  <button
    type="button"
    class="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
    onclick={onClose}>Close</button
  >{#if hasForm}<button
      type="button"
      class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
      onclick={onClose}>Preview only</button
    >{/if}
</div>
