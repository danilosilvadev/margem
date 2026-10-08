import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { brand } from "@shared/brand"
import { LANG_LABEL, type CatalogBook } from "@shared/types"
import { allProgress, getShelf } from "@/lib/db"
import { loadCatalog } from "@/lib/catalog"
import { useApp } from "@/state/AppProvider"

export function LibraryPage() {
  const { tick } = useApp()
  const [books, setBooks] = useState<CatalogBook[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shelf, setShelfState] = useState<string[]>([])
  const [progress, setProgress] = useState<Record<string, string>>({})

  useEffect(() => {
    document.title = brand.name
    let cancel = false
    void loadCatalog()
      .then((next) => {
        if (!cancel) setBooks(next)
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "Could not open the catalog")
      })
    void getShelf().then((items) => {
      if (!cancel) setShelfState(items.map((item) => item.bookId))
    })
    void allProgress().then((rows) => {
      if (cancel) return
      const map: Record<string, string> = {}
      for (const row of rows) map[row.bookId] = row.chapterId
      setProgress(map)
    })
    return () => {
      cancel = true
    }
  }, [tick])

  const onShelf = books?.filter((book) => shelf.includes(book.id)) ?? []

  return (
    <main data-testid="library" className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-xs tracking-[0.2em] text-muted uppercase">Three languages, one page</p>
      <h1 className="mt-2 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">{brand.tagline}</h1>
      <p className="mt-4 max-w-xl text-muted">
        Open a book and read it in Portuguese, Spanish, and English. Nothing to sign up for. Your place, marks, and notes stay in this browser.
      </p>

      {error ? (
        <p className="mt-8 rounded-xl border border-line bg-paper-2 px-4 py-3 text-sm" role="alert">
          {error} If you have opened {brand.name} before, the catalog should already be stored here.
        </p>
      ) : null}

      {!books && !error ? <p className="mt-10 text-muted">Opening the shelf…</p> : null}

      {books && onShelf.length === 0 ? (
        <p className="mt-10 text-sm text-muted">Your shelf is empty. Open a book and it will wait here, on this device.</p>
      ) : null}

      {onShelf.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">On your shelf</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {onShelf.map((book) => (
              <BookRow key={book.id} book={book} resume={progress[book.id]} />
            ))}
          </ul>
        </section>
      ) : null}

      {books ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl">Catalog</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {books.map((book) => (
              <BookRow key={book.id} book={book} resume={progress[book.id]} />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}

function BookRow({ book, resume }: { book: CatalogBook; resume?: string }) {
  const chapter = resume ?? book.chapters[0]?.id
  return (
    <li className="group grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-end" data-testid="book-card">
      <div className="border-l-2 border-accent/50 pl-4 group-hover:border-accent">
        <p className="text-xs tracking-widest text-muted uppercase">{book.languages.map((lang) => LANG_LABEL[lang]).join(" · ")}</p>
        <Link to={`/book/${book.id}`} className="mt-1 block font-serif text-3xl leading-tight hover:text-accent">
          {book.title.en}
        </Link>
        <p className="mt-1 text-muted">
          {book.title.pt} · {book.title.es}
        </p>
        <p className="mt-2 text-sm">{book.authors.map((author) => author.name).join(" · ")}</p>
      </div>
      <div className="flex gap-4 text-sm sm:flex-col sm:items-end">
        <Link to={`/book/${book.id}`} className="hover:text-accent">
          About
        </Link>
        {chapter ? (
          <Link to={`/read/${book.id}/${chapter}`} className="hover:text-accent">
            {resume ? "Resume" : "Read"}
          </Link>
        ) : null}
      </div>
    </li>
  )
}
