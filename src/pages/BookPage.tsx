import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { brand } from "@shared/brand"
import { LANG_LABEL, type CatalogBook } from "@shared/types"
import { cachedBook, getShelf } from "@/lib/db"
import { loadBook, loadCatalog } from "@/lib/catalog"
import { useApp } from "@/state/AppProvider"
import { Button } from "@/components/ui/button"

export function BookPage() {
  const { bookId = "" } = useParams()
  const { toggleOnShelf, tick } = useApp()
  const [book, setBook] = useState<CatalogBook | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [onShelf, setOnShelf] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  useEffect(() => {
    let cancel = false
    void loadCatalog()
      .then((books) => {
        const found = books.find((item) => item.id === bookId) ?? null
        if (!found) throw new Error("That book is not in the catalog.")
        if (!cancel) {
          setBook(found)
          document.title = `${found.title.en} · ${brand.name}`
        }
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "Could not open this book")
      })
    void getShelf().then((items) => {
      if (!cancel) setOnShelf(items.some((item) => item.bookId === bookId))
    })
    void cachedBook(bookId).then((cached) => {
      if (!cancel) setOfflineReady(Boolean(cached))
    })
    void loadBook(bookId)
      .then(() => {
        if (!cancel) setOfflineReady(true)
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [bookId, tick])

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p role="alert">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-accent">
          Back to the shelf
        </Link>
      </main>
    )
  }
  if (!book) return <main className="mx-auto max-w-3xl px-5 py-16 text-muted">Fetching the book…</main>

  const chapter = book.chapters[0]
  return (
    <main className="mx-auto max-w-3xl px-5 py-10" data-testid="book-detail">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">{book.year}</p>
      <h1 className="mt-2 font-serif text-5xl leading-none">{book.title.en}</h1>
      <p className="mt-3 font-serif text-2xl text-muted">{book.title.pt}</p>
      <p className="font-serif text-2xl text-muted">{book.title.es}</p>
      <ul className="mt-6 space-y-1 text-sm">
        {book.authors.map((author) => (
          <li key={`${author.role}-${author.name}`}>
            <span className="text-muted">{author.role}. </span>
            {author.name}
            {author.years ? <span className="text-muted"> ({author.years})</span> : null}
          </li>
        ))}
      </ul>
      <p className="mt-6 max-w-prose text-lg">{book.summary}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {chapter ? (
          <Button asChild>
            <Link to={`/read/${book.id}/${chapter.id}`}>Start reading</Link>
          </Button>
        ) : null}
        <Button
          variant="line"
          onClick={() => {
            void toggleOnShelf(book.id, !onShelf).then(() => setOnShelf((value) => !value))
          }}
        >
          {onShelf ? "Remove from shelf" : "Keep on my shelf"}
        </Button>
      </div>
      <p className="mt-3 text-sm text-muted">
        {offlineReady ? "The text is stored on this device for offline reading." : "The text downloads when you open it, then stays available offline."}
      </p>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Chapters</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {book.chapters.map((item, index) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4 py-3">
              <Link to={`/read/${book.id}/${item.id}`} className="hover:text-accent">
                <span className="mr-3 text-muted">{index + 1}</span>
                {item.title.en}
              </Link>
              <span className="text-sm text-muted">{item.paragraphCount} stanzas</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 space-y-6">
        <h2 className="font-serif text-2xl">Why these texts are free to read</h2>
        {book.rights.map((right) => (
          <article key={right.lang}>
            <h3 className="text-sm tracking-wide text-muted uppercase">{LANG_LABEL[right.lang]}</h3>
            <p className="mt-1 font-medium">
              {right.title} — {right.credit}
            </p>
            <p className="text-sm text-muted">{right.edition}</p>
            <p className="mt-2 text-sm">{right.rationale}</p>
            <a className="text-sm text-accent underline-offset-2 hover:underline" href={right.source}>
              Source
            </a>
          </article>
        ))}
      </section>
    </main>
  )
}
