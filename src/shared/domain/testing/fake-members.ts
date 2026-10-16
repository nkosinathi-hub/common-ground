import { ok, type Result } from "../result"
import type { MemberDirectory, MemberRef } from "../member"

/** The one in-memory MemberDirectory for tests: a copy of `list` on every call. */
export class FakeMemberDirectory implements MemberDirectory {
  constructor(public list: MemberRef[] = []) {}

  async members(): Promise<Result<MemberRef[]>> {
    return ok([...this.list])
  }
}
