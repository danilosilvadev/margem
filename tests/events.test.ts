import { describe, expect, it } from "vitest"
import { createIdentity, identityFromMnemonic } from "../shared/identity.ts"
import { KIND, eventId, signEvent, verifyEvent, type SignedEvent } from "../shared/events.ts"

describe("signing", () => {
  it("verifies a signed event and rejects tampering", async () => {
    const identity = await createIdentity()
    const event = await signEvent(
      {
        pubkey: identity.publicKey,
        created_at: 1_700_000_000,
        kind: KIND.comment,
        tags: [
          ["b", "the-raven"],
          ["c", "poem"],
          ["p", "s01"],
        ],
        content: "The visitor is already inside the line.",
      },
      identity.secretKey,
    )
    expect(event.id).toBe(eventId(event))
    expect(await verifyEvent(event, 1_700_000_000)).toBe(true)

    const tampered = { ...event, content: "A different sentence." } as SignedEvent
    expect(await verifyEvent(tampered, 1_700_000_000)).toBe(false)

    const badSig = { ...event, sig: "ab".repeat(64) }
    expect(await verifyEvent(badSig, 1_700_000_000)).toBe(false)
  })

  it("restores the same key from the recovery phrase", async () => {
    const identity = await createIdentity()
    const again = await identityFromMnemonic(identity.mnemonic, "Ada", identity.createdAt)
    expect(again.publicKey).toBe(identity.publicKey)
    expect(again.secretKey).toBe(identity.secretKey)
    await expect(identityFromMnemonic("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about")).resolves.toBeTruthy()
    await expect(identityFromMnemonic("not a real phrase at all")).rejects.toThrow(/not valid/)
  })
})
