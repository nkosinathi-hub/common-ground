<script lang="ts">
  import BoardCard from "../BoardCard.svelte"
  import KanbanColumn from "../KanbanColumn.svelte"
  import MoveMenu from "../MoveMenu.svelte"

  interface Props {
    items: { id: string; title: string }[]
    onmove: (id: string, column: string) => void
    onadd?: () => void
  }

  let { items, onmove, onadd }: Props = $props()
  const COLUMNS = [
    { id: "exploring", title: "Exploring" },
    { id: "planning", title: "Planning" },
  ]
</script>

<KanbanColumn
  id="exploring"
  title="Exploring"
  board="ideas"
  {items}
  {onadd}
  empty="New ideas land here."
  onmove={(id, column) => onmove(id, column)}
>
  {#snippet card(item)}
    <BoardCard title={item.title} href="#/i/{item.id}" tags={["travel"]}>
      {#snippet menu()}
        <MoveMenu
          subject={item.title}
          columns={COLUMNS}
          current="exploring"
          heading="Move to stage"
          onmove={(column) => onmove(item.id, column)}
        />
      {/snippet}
    </BoardCard>
  {/snippet}
</KanbanColumn>
