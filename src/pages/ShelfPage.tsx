import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { workById, authorById } from "@shared/canon"
import { KIND } from "@shared/events"
import { allBookmarks, allEvents, allHighlights, allProgress, getShelf } from "@/lib/db"
import { loadCatalog } from "@/lib/catalog"
import { useApp } from "@/state/AppProvider"
import type { CatalogBook } from "@shared/types"

export function ShelfPage() {
  const { identity, tick } = useApp()
  const [shelf, setShelf] = useState<string[]>([])
  const [books, setBooks] = useState<CatalogBook[]>([])
  const [stats, setStats] = useState({ progress: 0, marks: 0, quotes: 0, notes: 0 })
  const [quotes, setQuotes] = useState<{ id: string; quote: string; bookId: string }[]>([])

  useEffect(() => {
    let cancel = false
    void Promise.all([getShelf(), loadCatalog(), allProgress(), allBookmarks(), allHighlights(), allEvents()]).then(
      ([shelfRows, catalog, progress, marks, highlights, events]) => {
        if (cancel) return
        setShelf(shelfRows.map((row) => row.bookId))
        setBooks(catalog)
        setStats({
          progress: progress.length,
          marks: marks.length,
          quotes: highlights.length,
          notes: events.filter((event) => event.kind === KIND.comment && event.pubkey === identity.publicKey).length,
        })
        setQuotes(highlights.slice(0, 8).map((item) => ({ id: item.id, quote: item.quote, bookId: item.bookId })))
      },
    )
    return () => {
      cancel = true
    }
  }, [tick, identity.publicKey])

  return (
    <main data-testid="shelf" className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <header>
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">On this device</p>
        <h1 className="font-serif text-4xl">My shelf</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Progress, marks, and quotes stay in this browser. Nothing here is an account.
        </p>
      </header>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Books in progress", stats.progress],
          ["Bookmarks", stats.marks],
          ["Highlights", stats.quotes],
          ["Notes you signed", stats.notes],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <p className="font-serif text-3xl text-primary">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </article>
        ))}
      </section>
      <section>
        <h2 className="font-serif text-2xl">Kept here</h2>
        {shelf.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">The shelf is empty. Open a book and keep it.</p> : null}
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {shelf.map((id) => {
            const catalog = books.find((book) => book.id === id)
            const work = workById(id) ?? workById(catalog?.id ?? "")
            const title = catalog?.title.en ?? work?.title ?? id
            return (
              <li key={id} className="flex items-baseline justify-between py-3">
                <Link to={`/book/${id}`} className="font-serif text-xl hover:text-primary">
                  {title}
                </Link>
                <span className="text-sm text-muted-foreground">{authorById(work?.authorId ?? "")?.name}</span>
              </li>
            )
          })}
        </ul>
      </section>
      <section>
        <h2 className="font-serif text-2xl">Quotes you marked</h2>
        {quotes.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Select a line in the reader and choose Highlight.</p> : null}
        <ul className="mt-3 space-y-3">
          {quotes.map((quote) => (
            <li key={quote.id} className="rounded-xl border border-gold/30 bg-card p-4">
              <p className="font-serif text-lg">“{quote.quote}”</p>
              <Link to={`/book/${quote.bookId}`} className="text-sm text-primary">
                {books.find((book) => book.id === quote.bookId)?.title.en ?? workById(quote.bookId)?.title ?? "The book"}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
