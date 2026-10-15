import { expect, test } from "@playwright/test"
import { memberIds, rpc, signedInClient } from "../support/clients"
import { createUser, requireStack } from "../support/stack"

requireStack()

// Two people redeem one invite link at the same moment: the row lock admits exactly one.
test("a raced invite token admits exactly one member", async () => {
  test.setTimeout(60_000)
  const [ana, ben, cal] = await Promise.all([
    createUser("racer-owner"),
    createUser("racer-ben"),
    createUser("racer-cal"),
  ])
  const [owner, first, second] = await Promise.all([ana, ben, cal].map(signedInClient))
  const spaceId = await rpc<string>(owner!, "create_space", {
    space_name: "Race",
    space_template: "blank",
  })
  const token = await rpc<string>(owner!, "create_invite", { target_space: spaceId })

  const replies = await Promise.all(
    [first!, second!].map((client) => client.rpc("redeem_invite", { token })),
  )
  const joined = replies.filter((reply) => !reply.error)
  const refused = replies.filter((reply) => reply.error)
  expect(joined).toHaveLength(1)
  expect(joined[0]!.data).toBe(spaceId)
  expect(refused).toHaveLength(1)
  expect(refused[0]!.error!.message).toBe("this invitation is no longer valid")

  const members = await memberIds(spaceId)
  expect(members).toHaveLength(2)
  const ids = await Promise.all(
    [first!, second!].map(async (client) => (await client.auth.getUser()).data.user!.id),
  )
  expect(ids.filter((id) => members.includes(id))).toHaveLength(1)
})
