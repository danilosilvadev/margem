import { KIND, tagValue, type SignedEvent } from "./events.ts"
import { isHidden, policyFrom } from "./merge.ts"

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export type RoomPost = {
  id: string
  pubkey: string
  createdAt: number
  title: string
  bookId: string
  note: string
}

export type ThreadPost = {
  id: string
  pubkey: string
  createdAt: number
  salonId: string
  title: string
  body: string
  parentId: string | null
  pinned: boolean
}

export type MarginPost = {
  id: string
  pubkey: string
  createdAt: number
  bookId: string
  quote: string
  note: string
}

export type LetterPost = {
  id: string
  pubkey: string
  createdAt: number
  body: string
  regarding: string
}

function visible(events: SignedEvent[], ownerPubkey: string): SignedEvent[] {
  const policy = policyFrom(events, ownerPubkey)
  return events.filter((event) => !isHidden(event, policy))
}

function readJson(content: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(content) as unknown
    if (!value || typeof value !== "object" || Array.isArray(value)) return null
    return value as Record<string, unknown>
  } catch {
    return null
  }
}

function text(value: unknown, max = 2000): string {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, max)
}

export function readingRooms(events: SignedEvent[], ownerPubkey: string): RoomPost[] {
  return visible(events, ownerPubkey)
    .filter((event) => event.kind === KIND.readingRoom)
    .map((event) => {
      const body = readJson(event.content)
      return {
        id: event.id,
        pubkey: event.pubkey,
        createdAt: event.created_at,
        title: text(body?.title, 140),
        bookId: tagValue(event, "b") ?? text(body?.bookId, 64),
        note: text(body?.note, 800),
      }
    })
    .filter((room) => room.title)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function salonThreads(events: SignedEvent[], ownerPubkey: string, salonId: string): ThreadPost[] {
  return visible(events, ownerPubkey)
    .filter((event) => event.kind === KIND.salonPost && tagValue(event, "s") === salonId)
    .map((event) => {
      const body = readJson(event.content)
      return {
        id: event.id,
        pubkey: event.pubkey,
        createdAt: event.created_at,
        salonId,
        title: text(body?.title, 160),
        body: text(body?.body, 4000),
        parentId: tagValue(event, "e") ?? null,
        pinned: tagValue(event, "pin") === "1" && !tagValue(event, "e"),
      }
    })
    .filter((post) => post.body)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt)
}

export function marginalia(events: SignedEvent[], ownerPubkey: string): MarginPost[] {
  return visible(events, ownerPubkey)
    .filter((event) => event.kind === KIND.marginalia)
    .map((event) => {
      const body = readJson(event.content)
      return {
        id: event.id,
        pubkey: event.pubkey,
        createdAt: event.created_at,
        bookId: tagValue(event, "b") ?? "",
        quote: text(body?.quote, 400),
        note: text(body?.note, 800),
      }
    })
    .filter((post) => post.quote || post.note)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function letters(events: SignedEvent[], ownerPubkey: string): LetterPost[] {
  return visible(events, ownerPubkey)
    .filter((event) => event.kind === KIND.letter)
    .map((event) => {
      const body = readJson(event.content)
      return {
        id: event.id,
        pubkey: event.pubkey,
        createdAt: event.created_at,
        body: text(body?.body, 4000),
        regarding: text(body?.regarding, 120),
      }
    })
    .filter((letter) => letter.body)
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** Books mentioned by synced events in the recent window. Count is events, not people. */
export function trendingBooks(events: SignedEvent[], ownerPubkey: string, nowMs: number, windowMs = WEEK_MS): { bookId: string; count: number }[] {
  const start = Math.floor((nowMs - windowMs) / 1000)
  const counts = new Map<string, number>()
  for (const event of visible(events, ownerPubkey)) {
    if (event.created_at < start) continue
    if (event.kind !== KIND.comment && event.kind !== KIND.marginalia && event.kind !== KIND.readingRoom && event.kind !== KIND.salonPost) continue
    const bookId = tagValue(event, "b")
    if (!bookId) continue
    counts.set(bookId, (counts.get(bookId) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([bookId, count]) => ({ bookId, count }))
    .sort((a, b) => b.count - a.count || a.bookId.localeCompare(b.bookId))
}
