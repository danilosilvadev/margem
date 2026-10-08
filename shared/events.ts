import { sha256 } from "@noble/hashes/sha2.js"
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js"
import { signAsync, verifyAsync } from "@noble/ed25519"

export const KIND = {
  profile: 0,
  comment: 1,
  delete: 5,
  blocklist: 30001,
} as const

export type Kind = (typeof KIND)[keyof typeof KIND]

export const MAX_CONTENT_CHARS = 4000
export const MAX_FUTURE_SKEW_SEC = 120

export type UnsignedEvent = {
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
}

export type SignedEvent = UnsignedEvent & {
  id: string
  sig: string
}

const HEX_64 = /^[0-9a-f]{64}$/
const HEX_128 = /^[0-9a-f]{128}$/

export function canonicalMessage(event: UnsignedEvent): Uint8Array {
  return utf8ToBytes(
    JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]),
  )
}

export function eventId(event: UnsignedEvent): string {
  return bytesToHex(sha256(canonicalMessage(event)))
}

export function tagValue(event: { tags: string[][] }, name: string): string | undefined {
  return event.tags.find((tag) => tag[0] === name)?.[1]
}

export function shapeError(event: SignedEvent, nowSec = Math.floor(Date.now() / 1000)): string | null {
  if (!HEX_64.test(event.pubkey)) return "public key"
  if (!HEX_64.test(event.id)) return "id"
  if (!HEX_128.test(event.sig)) return "signature"
  if (!Number.isInteger(event.created_at) || event.created_at < 0) return "created_at"
  if (event.created_at > nowSec + MAX_FUTURE_SKEW_SEC) return "created_at is too far in the future"
  if (!Number.isInteger(event.kind)) return "kind"
  if (typeof event.content !== "string" || event.content.length > MAX_CONTENT_CHARS) return "content"
  if (!Array.isArray(event.tags) || event.tags.length > 20) return "tags"
  for (const tag of event.tags) {
    if (!Array.isArray(tag) || tag.length < 2 || tag.length > 4) return "tag"
    if (tag.some((part) => typeof part !== "string" || part.length > 200)) return "tag"
  }
  if (eventId(event) !== event.id) return "id does not match the event"
  return null
}

export async function signEvent(unsigned: UnsignedEvent, secretKeyHex: string): Promise<SignedEvent> {
  if (!HEX_64.test(unsigned.pubkey) || !HEX_64.test(secretKeyHex)) {
    throw new Error("Key material is not a 32-byte hex string")
  }
  const message = canonicalMessage(unsigned)
  const id = bytesToHex(sha256(message))
  const sig = bytesToHex(await signAsync(message, hexToBytes(secretKeyHex)))
  return { ...unsigned, id, sig }
}

export async function verifyEvent(event: SignedEvent, nowSec?: number): Promise<boolean> {
  if (shapeError(event, nowSec) !== null) return false
  try {
    return await verifyAsync(hexToBytes(event.sig), canonicalMessage(event), hexToBytes(event.pubkey))
  } catch {
    return false
  }
}

export type BlocklistBody = {
  blockedPubkeys: string[]
  blockedEventIds: string[]
  note?: string
}

export function parseBlocklist(event: SignedEvent): BlocklistBody | null {
  if (event.kind !== KIND.blocklist) return null
  try {
    const body = JSON.parse(event.content) as BlocklistBody
    if (!Array.isArray(body.blockedPubkeys) || !Array.isArray(body.blockedEventIds)) return null
    return {
      blockedPubkeys: body.blockedPubkeys.filter((key) => HEX_64.test(key)),
      blockedEventIds: body.blockedEventIds.filter((id) => HEX_64.test(id)),
      note: typeof body.note === "string" ? body.note.slice(0, 280) : undefined,
    }
  } catch {
    return null
  }
}

export function profileName(event: SignedEvent): string | null {
  if (event.kind !== KIND.profile) return null
  try {
    const body = JSON.parse(event.content) as { name?: unknown }
    if (typeof body.name !== "string") return null
    const name = body.name.trim().replace(/\s+/g, " ")
    if (!name || name.length > 40) return null
    return name
  } catch {
    return null
  }
}
