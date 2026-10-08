import { describe, expect, it } from "vitest"
import { createIdentity } from "../shared/identity.ts"
import { KIND, signEvent, type SignedEvent } from "../shared/events.ts"
import { mergeEvents, visibleComments } from "../shared/merge.ts"

async function comment(identity: { publicKey: string; secretKey: string }, content: string, at: number, paragraph = "s01") {
  return signEvent(
    {
      pubkey: identity.publicKey,
      created_at: at,
      kind: KIND.comment,
      tags: [
        ["b", "the-raven"],
        ["c", "poem"],
        ["p", paragraph],
      ],
      content,
    },
    identity.secretKey,
  )
}

describe("sync merge", () => {
  it("unions events, ignores duplicates, and sorts by time", async () => {
    const ada = await createIdentity()
    const bo = await createIdentity()
    const first = await comment(ada, "First", 10)
    const second = await comment(bo, "Second", 11)
    const merged = mergeEvents([first], [second, first], ada.publicKey)
    expect(merged.map((event) => event.content)).toEqual(["First", "Second"])
    expect(mergeEvents(merged, [second], ada.publicKey)).toHaveLength(2)
  })

  it("hides a pubkey and an event id from the owner blocklist", async () => {
    const owner = await createIdentity()
    const ada = await createIdentity()
    const bo = await createIdentity()
    const kept = await comment(bo, "Stays", 20)
    const dropped = await comment(ada, "Goes", 21)
    const block = await signEvent(
      {
        pubkey: owner.publicKey,
        created_at: 30,
        kind: KIND.blocklist,
        tags: [["d", "blocklist"]],
        content: JSON.stringify({ blockedPubkeys: [ada.publicKey], blockedEventIds: [] }),
      },
      owner.secretKey,
    )
    const visible = visibleComments([kept, dropped, block], owner.publicKey)
    expect(visible.map((event) => event.id)).toEqual([kept.id])

    const byId = await signEvent(
      {
        pubkey: owner.publicKey,
        created_at: 31,
        kind: KIND.blocklist,
        tags: [["d", "blocklist"]],
        content: JSON.stringify({ blockedPubkeys: [], blockedEventIds: [kept.id] }),
      },
      owner.secretKey,
    )
    expect(visibleComments([kept, dropped, byId], owner.publicKey).map((event) => event.id)).toEqual([dropped.id])
    expect(mergeEvents([kept, dropped, block], [], "someone-else")).toHaveLength(3)
  })

  it("honors the author's deletion and ignores someone else's", async () => {
    const ada = await createIdentity()
    const bo = await createIdentity()
    const note = await comment(ada, "Regret", 40)
    const ownDelete = await signEvent(
      {
        pubkey: ada.publicKey,
        created_at: 41,
        kind: KIND.delete,
        tags: [["e", note.id], ["b", "the-raven"], ["c", "poem"]],
        content: "",
      },
      ada.secretKey,
    )
    expect(visibleComments([note, ownDelete], ada.publicKey)).toHaveLength(0)

    const forged = await signEvent(
      {
        pubkey: bo.publicKey,
        created_at: 42,
        kind: KIND.delete,
        tags: [["e", note.id]],
        content: "",
      },
      bo.secretKey,
    )
    const stillThere = visibleComments([note, forged], ada.publicKey)
    expect(stillThere.map((event: SignedEvent) => event.id)).toEqual([note.id])
  })
})
