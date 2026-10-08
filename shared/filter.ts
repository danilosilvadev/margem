import { tagValue, type SignedEvent } from "./events.ts"

export type EventFilter = {
  kinds?: number[]
  book?: string
  chapter?: string
  since?: number
}

export function matchesFilter(event: SignedEvent, filter: EventFilter): boolean {
  if (filter.kinds && !filter.kinds.includes(event.kind)) return false
  if (filter.since !== undefined && event.created_at < filter.since) return false
  if (filter.book && tagValue(event, "b") !== filter.book) return false
  if (filter.chapter && tagValue(event, "c") !== filter.chapter) return false
  return true
}
