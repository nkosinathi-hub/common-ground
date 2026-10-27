<script lang="ts">
  import { MessageCircle, MoreHorizontal } from "@lucide/svelte"
  import { demoNotes } from "./demo-data"
  interface Props {
    onAction: (action: string) => void
  }
  let { onAction }: Props = $props()
</script>

<div class="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
  <section class="rounded-2xl border bg-card p-5">
    <div class="mb-5">
      <h2 class="font-semibold">The conversation</h2>
      <p class="mt-1 text-sm text-muted-foreground">Updates, questions and things to remember</p>
    </div>
    <div class="space-y-4">
      {#each demoNotes as note (note.when)}<article class="rounded-xl border p-4">
          <div class="flex items-center gap-3">
            <span
              class="grid size-9 place-items-center rounded-full bg-sky-100 text-sm font-semibold"
              >{note.initial}</span
            >
            <div>
              <p class="text-sm font-medium">{note.name}</p>
              <p class="text-xs text-muted-foreground">{note.when}</p>
            </div>
            <button
              type="button"
              class="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted"
              aria-label="More note actions"
              onclick={() => onAction("note-actions")}><MoreHorizontal class="size-4" /></button
            >
          </div>
          <p class="mt-3 text-sm leading-relaxed">{note.text}</p>
          <button
            type="button"
            class="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary"
            onclick={() => onAction("thread")}
            ><MessageCircle class="size-3.5" />{note.replies
              ? `${note.replies} replies · Reply`
              : "Reply"}</button
          >
        </article>{/each}
    </div>
  </section>
  <aside class="grid content-start gap-4">
    <section class="rounded-2xl border bg-card p-5">
      <h2 class="font-semibold">A thoughtful space</h2>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        Notes can be shared with everyone or kept between two people. Conversations stay connected
        to what you're talking about.
      </p>
      <button
        type="button"
        class="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        onclick={() => onAction("note")}>Write a note</button
      >
    </section>
    <section class="rounded-2xl border bg-card p-5">
      <h2 class="font-semibold">People here</h2>
      {#each [{ name: "Ana", letter: "A", tint: "bg-rose-100" }, { name: "Ben", letter: "B", tint: "bg-sky-100" }] as person (person.name)}<div
          class="mt-4 flex items-center gap-3"
        >
          <span
            class="grid size-9 place-items-center rounded-full text-sm font-semibold {person.tint}"
            >{person.letter}</span
          ><span class="flex-1 text-sm">{person.name}</span><span
            class="size-2 rounded-full bg-emerald-500"
          ></span>
        </div>{/each}
    </section>
  </aside>
</div>
