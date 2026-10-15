import type { ParentRef } from "../domain/comment"
import type { MemberRef } from "../domain/mentions"
import { FakeCommentsGateway } from "./fake-comments-gateway"

export const SPACE = "s1"
export const PARENT: ParentRef = { kind: "watch", id: "w1" }
export const MEMBERS: MemberRef[] = [
  { id: "me", displayName: "Nkosi" },
  { id: "zola", displayName: "Zola" },
  { id: "anele", displayName: "Anele" },
]

/** A gateway acting as "me" with one comment by Zola already in the thread. */
export function threadGateway(): FakeCommentsGateway {
  const gateway = new FakeCommentsGateway()
  gateway.seed(SPACE, PARENT, 1, "zola")
  return gateway
}
