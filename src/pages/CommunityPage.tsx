import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { KIND } from "@shared/events"
import { SALONS, workById, authorById } from "@shared/canon"
import { letters, marginalia, readingRooms, trendingBooks } from "@shared/community"
import { displayNames } from "@shared/merge"
import { allEvents } from "@/lib/db"
import { useApp } from "@/state/AppProvider"
import { Button } from "@/components/ui/button"
import type { StoredEvent } from "@/lib/db"

export function CommunityPage() {
  const { tick, ownerPubkey, identity, publishCommunity } = useApp()
  const [events, setEvents] = useState<StoredEvent[]>([])
  const [roomTitle, setRoomTitle] = useState("")
  const [roomBook, setRoomBook] = useState("the-raven")
  const [roomNote, setRoomNote] = useState("")
  const [quote, setQuote] = useState("")
  const [marginNote, setMarginNote] = useState("")
  const [letter, setLetter] = useState("")
  const [regarding, setRegarding] = useState("")

  useEffect(() => {
    let cancel = false
    void allEvents().then((rows) => {
      if (!cancel) setEvents(rows)
    })
    return () => {
      cancel = true
    }
  }, [tick])

  const names = displayNames(events, ownerPubkey)
  const rooms = readingRooms(events, ownerPubkey)
  const marks = marginalia(events, ownerPubkey)
  const trending = trendingBooks(events, ownerPubkey, Date.now())
  const mail = letters(events, ownerPubkey)

  return (
    <main data-testid="community" className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-hero p-6 text-cream md:p-8">
        <h1 className="font-serif text-3xl md:text-4xl">Community</h1>
        <p className="mt-2 max-w-2xl text-sm text-cream/75">
          Open rooms, themed salons, marginalia, and letters. Every post is a signed event. The owner’s blocklist can hide a key or a single note. There is no account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Open reading rooms</h2>
        <p className="text-sm text-muted-foreground">A room is a signed invitation to read something together. It is not a scheduled class.</p>
        <form
          className="grid gap-2 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!roomTitle.trim()) return
            void publishCommunity({
              kind: KIND.readingRoom,
              tags: [["b", roomBook]],
              content: JSON.stringify({ title: roomTitle.trim(), note: roomNote.trim() }),
            }).then(() => {
              setRoomTitle("")
              setRoomNote("")
            })
          }}
        >
          <input value={roomTitle} onChange={(event) => setRoomTitle(event.target.value)} placeholder="Room title" className="rounded-md border border-border bg-background px-3 py-2" />
          <input value={roomBook} onChange={(event) => setRoomBook(event.target.value)} placeholder="Book id, for example the-raven" className="rounded-md border border-border bg-background px-3 py-2" />
          <textarea value={roomNote} onChange={(event) => setRoomNote(event.target.value)} placeholder="When and how you want to read" className="min-h-20 rounded-md border border-border bg-background px-3 py-2 md:col-span-2" />
          <Button type="submit">Open a room</Button>
        </form>
        {rooms.length === 0 ? <p className="text-sm text-muted-foreground">No room has been signed on this device yet.</p> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <article key={room.id} className="rounded-xl border border-border bg-card p-4 shadow-soft" data-testid="reading-room">
              <p className="font-serif text-lg">{room.title}</p>
              <p className="text-xs text-muted-foreground">{names.get(room.pubkey) ?? "A reader"} · {labelWork(room.bookId)}</p>
              {room.note ? <p className="mt-2 text-sm">{room.note}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Themed salons</h2>
        <p className="text-sm text-muted-foreground">Standing rooms. Pinned lines are editorial questions. Threads under them are signed.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SALONS.map((salon) => (
            <Link key={salon.id} to={`/salon/${salon.id}`} className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-soft hover:border-primary">
              <span className="font-serif text-3xl text-primary">{salon.icon}</span>
              <p className="mt-2 font-serif text-xl">{salon.name}</p>
              <p className="text-sm text-muted-foreground">{salon.short}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-serif text-2xl">Marginalia</h2>
          <p className="text-sm text-muted-foreground">A quote and a note, signed with your reading key. Not a mentor’s feed. Yours, and whoever else has synced.</p>
          <form
            className="space-y-2 rounded-xl border border-border bg-card p-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!quote.trim() && !marginNote.trim()) return
              void publishCommunity({
                kind: KIND.marginalia,
                tags: [["b", "the-raven"]],
                content: JSON.stringify({ quote: quote.trim(), note: marginNote.trim() }),
              }).then(() => {
                setQuote("")
                setMarginNote("")
              })
            }}
          >
            <textarea value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="The line" className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2" />
            <textarea value={marginNote} onChange={(event) => setMarginNote(event.target.value)} placeholder="What you want beside it" className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2" />
            <Button type="submit">Sign this mark</Button>
          </form>
          {marks.length === 0 ? <p className="text-sm text-muted-foreground">No marginalia synced here yet.</p> : null}
          {marks.slice(0, 6).map((mark) => (
            <article key={mark.id} className="rounded-xl border border-gold/30 bg-card p-4" data-testid="marginalia">
              {mark.quote ? <p className="font-serif">“{mark.quote}”</p> : null}
              {mark.note ? <p className="mt-2 text-sm">{mark.note}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">{names.get(mark.pubkey) ?? shortKey(mark.pubkey)} · {labelWork(mark.bookId)}</p>
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl">Trending this week</h2>
          <p className="text-sm text-muted-foreground">Counted from notes, rooms, marginalia, and salon posts synced to this browser in the last seven days. Not a global chart.</p>
          {trending.length === 0 ? <p className="text-sm text-muted-foreground">Nothing in the last seven days on this device.</p> : null}
          <ol className="space-y-2">
            {trending.map((item, index) => (
              <li key={item.bookId}>
                <Link to={`/book/${item.bookId}`} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 hover:border-primary">
                  <span className="font-serif text-2xl text-primary/50">{index + 1}</span>
                  <span className="flex-1 font-serif">{labelWork(item.bookId)}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="rounded-2xl border border-gold/40 bg-card p-6 shadow-soft">
        <h2 className="font-serif text-2xl">Anonymous letters</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A letter is signed by a one-time key, not by {identity.displayName || "your reading name"}. This browser does not keep that key, so the letter cannot be edited later. The public key is still on the event. The owner can hide the letter, or that one-time key, with the blocklist.
        </p>
        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!letter.trim()) return
            void publishCommunity({
              kind: KIND.letter,
              tags: [],
              content: JSON.stringify({ body: letter.trim(), regarding: regarding.trim() }),
              anonymous: true,
            }).then(() => {
              setLetter("")
              setRegarding("")
            })
          }}
        >
          <input value={regarding} onChange={(event) => setRegarding(event.target.value)} placeholder="Regarding, optional" className="w-full rounded-md border border-border bg-background px-3 py-2" />
          <textarea value={letter} onChange={(event) => setLetter(event.target.value)} placeholder="The letter" className="min-h-28 w-full rounded-md border border-border bg-background px-3 py-2" />
          <Button type="submit">Leave it on the table</Button>
        </form>
        <div className="mt-6 space-y-3">
          {mail.length === 0 ? <p className="text-sm text-muted-foreground">No letters yet.</p> : null}
          {mail.map((item) => (
            <article key={item.id} className="border-t border-border pt-3" data-testid="letter">
              <p className="text-xs tracking-[0.14em] text-gold uppercase">A one-time key{item.regarding ? ` · ${item.regarding}` : ""}</p>
              <p className="mt-1 whitespace-pre-wrap">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function labelWork(id: string): string {
  const work = workById(id)
  if (!work) return id || "A book"
  const author = authorById(work.authorId)
  return author ? `${work.title}, ${author.name}` : work.title
}

function shortKey(pubkey: string): string {
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`
}
