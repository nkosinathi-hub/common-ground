import { TRIGGERS, type DndEventInfo } from "svelte-dnd-action"

export interface BoardItem {
  readonly id: string
}

export interface Drop {
  readonly id: string
  readonly index: number
}

/**
 * The move a finished drag asks of this column: the dropped card and where it landed. Null in
 * the column the card left, and when the drag was cancelled, so each move is saved once.
 */
export function dropIn(items: readonly BoardItem[], info: DndEventInfo): Drop | null {
  if (info.trigger !== TRIGGERS.DROPPED_INTO_ZONE) return null
  const index = items.findIndex((item) => item.id === info.id)
  return index < 0 ? null : { id: String(info.id), index }
}
