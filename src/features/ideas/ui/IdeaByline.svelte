<script lang="ts">
  import { memberName, type MemberRef } from "@/shared/domain"
  import { peopleOf, type Idea } from "../domain"

  interface Props {
    idea: Idea
    authors: readonly MemberRef[]
  }

  let { idea, authors }: Props = $props()
  const others = $derived(
    peopleOf(idea)
      .filter((id) => id !== idea.createdBy)
      .map((id) => memberName(authors, id)),
  )
</script>

<!-- "Started by Ana · Shared with Ben": who it belongs to, in words; the avatars sit at the end. -->
<p class="type-sm text-muted-foreground">
  {[
    `Started by ${memberName(authors, idea.createdBy)}`,
    others.length > 0 && `Shared with ${others.join(", ")}`,
  ]
    .filter(Boolean)
    .join(" · ")}
</p>
