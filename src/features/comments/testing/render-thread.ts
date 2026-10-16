import type { ParentRef } from "../domain/comment"
import type { MemberRef } from "@/shared/domain"
import { FakeCommentsGateway } from "./fake-comments-gateway"

export const SPACE = "s1"
export const PARENT: ParentRef = { kind: "watch", id: "w1" }
export const MEMBERS: MemberRef[] = [
  { id: "me", displayName: "Nkosi" },
  { id: "zola", displayName: "Zola" },
  { id: "anele", displayName: "Anele" },
]

/** A gateway acting as "me", paging two at a time, with one comment by Zola in the thread. */
export function threadGateway(): FakeCommentsGateway {
  const gateway = new FakeCommentsGateway(2)
  gateway.seed(SPACE, PARENT, 1, "zola")
  return gateway
}
