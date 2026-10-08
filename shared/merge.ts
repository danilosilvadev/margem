import { KIND, parseBlocklist, tagValue, type SignedEvent } from "./events.ts"

export type Policy = {
  blockedPubkeys: Set<string>
  blockedEventIds: Set<string>
  deletedEventIds: Set<string>
  blocklistEvent: SignedEvent | null
}

export function policyFrom(events: SignedEvent[], ownerPubkey: string): Policy {
  const lists = events
    .filter((event) => event.kind === KIND.blocklist && event.pubkey === ownerPubkey)
    .sort((a, b) => a.created_at - b.created_at || a.id.localeCompare(b.id))
  const latest = lists.at(-1) ?? null
  const body = latest ? parseBlocklist(latest) : null
  const byId = new Map(events.map((event) => [event.id, event]))
  const deleted = new Set<string>()
  for (const event of events) {
    if (event.kind !== KIND.delete) continue
    const targetId = tagValue(event, "e")
    if (!targetId) continue
    const target = byId.get(targetId)
    if (target && target.pubkey === event.pubkey) deleted.add(targetId)
  }
  return {
    blockedPubkeys: new Set(body?.blockedPubkeys ?? []),
    blockedEventIds: new Set(body?.blockedEventIds ?? []),
    deletedEventIds: deleted,
    blocklistEvent: latest,
  }
}

export function isHidden(event: SignedEvent, policy: Policy): boolean {
  if (event.kind === KIND.blocklist) return false
  if (policy.blockedEventIds.has(event.id)) return true
  if (policy.blockedPubkeys.has(event.pubkey)) return true
  if (policy.deletedEventIds.has(event.id)) return true
  return false
}

/** Union by id. Caller must pass only signature-checked events. */
export function mergeEvents(existing: SignedEvent[], incoming: SignedEvent[], ownerPubkey: string): SignedEvent[] {
  const map = new Map<string, SignedEvent>()
  for (const event of existing) map.set(event.id, event)
  for (const event of incoming) map.set(event.id, event)
  const policy = policyFrom([...map.values()], ownerPubkey)
  return [...map.values()]
    .filter((event) => !isHidden(event, policy))
    .sort((a, b) => a.created_at - b.created_at || a.id.localeCompare(b.id))
}

export function visibleComments(events: SignedEvent[], ownerPubkey: string): SignedEvent[] {
  const policy = policyFrom(events, ownerPubkey)
  return events
    .filter((event) => event.kind === KIND.comment && !isHidden(event, policy))
    .sort((a, b) => a.created_at - b.created_at || a.id.localeCompare(b.id))
}

export function displayNames(events: SignedEvent[], ownerPubkey: string): Map<string, string> {
  const policy = policyFrom(events, ownerPubkey)
  const names = new Map<string, { at: number; name: string }>()
  for (const event of events) {
    if (event.kind !== KIND.profile || isHidden(event, policy)) continue
    try {
      const body = JSON.parse(event.content) as { name?: unknown }
      if (typeof body.name !== "string") continue
      const name = body.name.trim()
      if (!name) continue
      const prev = names.get(event.pubkey)
      if (!prev || event.created_at >= prev.at) names.set(event.pubkey, { at: event.created_at, name })
    } catch {
      /* ignore malformed profile */
    }
  }
  return new Map([...names].map(([pubkey, value]) => [pubkey, value.name]))
}
