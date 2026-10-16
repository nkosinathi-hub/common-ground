import { ok, type Result } from "../result"
import type { AuthorDirectory, MemberDirectory, MemberRef } from "../member"

/**
 * The one in-memory MemberDirectory for tests: a copy of `list` on every call. As an
 * AuthorDirectory it also names `former` people, removed but with a profile still visible.
 */
export class FakeMemberDirectory implements MemberDirectory, AuthorDirectory {
  constructor(
    public list: MemberRef[] = [],
    public former: MemberRef[] = [],
  ) {}

  async members(): Promise<Result<MemberRef[]>> {
    return ok([...this.list])
  }

  async authors(): Promise<Result<MemberRef[]>> {
    return ok([...this.list, ...this.former])
  }
}
