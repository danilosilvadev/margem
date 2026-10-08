import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ERAS, WORKS, authorById, type Work } from "@shared/canon"
import { brand } from "@shared/brand"
import { LANG_LABEL, type CatalogBook } from "@shared/types"
import { allProgress, getShelf } from "@/lib/db"
import { loadCatalog } from "@/lib/catalog"
import { GeneratedCover } from "@/components/GeneratedCover"
import { useApp } from "@/state/AppProvider"

export function LibraryPage() {
  const { tick } = useApp()
  const [books, setBooks] = useState<CatalogBook[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shelf, setShelfState] = useState<string[]>([])
  const [progress, setProgress] = useState<Record<string, string>>({})
  const [query, setQuery] = useState("")

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

  const featured = WORKS.find((work) => work.textId) ?? WORKS[0]
  const featuredAuthor = featured ? authorById(featured.authorId) : undefined
  const needle = query.trim().toLowerCase()
  const found = useMemo(() => {
    if (needle.length < 2) return []
    return WORKS.filter((work) => {
      const author = authorById(work.authorId)
      return work.title.toLowerCase().includes(needle) || (author?.name.toLowerCase().includes(needle) ?? false)
    })
  }, [needle])

  return (
    <main data-testid="library" className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-hero text-cream shadow-elevated">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--gold)/0.7),transparent_60%)]" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[auto_1fr] md:p-8">
          <Link to={`/book/${featured?.textId ?? featured?.id}`} className="block h-44 w-32 overflow-hidden rounded-xl shadow-elevated ring-2 ring-gold/50">
            <GeneratedCover bookId={featured?.id ?? "book"} title={featured?.title ?? "A book"} author={featuredAuthor?.name} className="h-full w-full" />
          </Link>
          <div>
            <p className="text-[10px] tracking-[0.25em] text-gold uppercase">On this device</p>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-cream md:text-4xl">{brand.tagline}</h1>
            <p className="mt-2 text-sm text-cream/75">
              {featured?.title} · {featuredAuthor?.name}. {featured?.synopsis}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/book/${featured?.textId ?? featured?.id}`} className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-wine-dark">
                Open the poem
              </Link>
              <Link to="/shelf" className="rounded-md border border-cream/30 px-4 py-2 text-sm text-cream">
                My shelf
              </Link>
            </div>
          </div>
        </div>
      </section>

      <label className="block">
        <span className="sr-only">Search by title or author</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or author"
          className="w-full rounded-md border border-border bg-card px-3 py-2"
        />
      </label>

      {needle.length >= 2 ? (
        <section>
          <h2 className="font-serif text-2xl">Search</h2>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {found.length === 0 ? <li className="py-4 text-sm text-muted-foreground">Nothing under that name.</li> : null}
            {found.map((work) => (
              <WorkRow key={work.id} work={work} />
            ))}
          </ul>
        </section>
      ) : null}

      {error ? <p role="alert">{error}</p> : null}

      <section>
        <h2 className="font-serif text-2xl">Ready to read</h2>
        <p className="mt-1 text-sm text-muted-foreground">The parallel text is on this device. The other shelves are the map of what can be added.</p>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {books?.map((book) => (
            <li key={book.id} data-testid="book-card" className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{book.year}</p>
                <Link to={`/book/${book.id}`} className="font-serif text-2xl hover:text-primary">
                  {book.title.en}
                </Link>
                <p className="text-muted-foreground">
                  {book.title.pt} · {book.title.es}
                </p>
                <p className="mt-1 text-sm">{book.authors.map((author) => author.name).join(" · ")}</p>
                <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">{book.languages.map((lang) => LANG_LABEL[lang]).join(" · ")}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <Link to={`/book/${book.id}`} className="text-primary">
                  About
                </Link>
                <Link to={`/read/${book.id}/${book.chapters[0]?.id ?? ""}`} className="text-primary">
                  Read
                </Link>
                {progress[book.id] ? (
                  <Link to={`/read/${book.id}/${progress[book.id]}`} className="text-muted-foreground">
                    Resume
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {shelf.length > 0 ? <p className="mt-3 text-sm text-muted-foreground">{shelf.length} on your shelf.</p> : null}
      </section>

      {ERAS.map((era) => {
        const works = WORKS.filter((work) => authorById(work.authorId)?.era === era.id)
        return (
          <section key={era.id}>
            <h2 className="font-serif text-2xl">{era.name}</h2>
            <p className="text-sm text-muted-foreground">{era.range}. {era.summary}</p>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {works.map((work) => (
                <Link key={work.id} to={`/book/${work.textId ?? work.id}`} className="w-44 shrink-0 rounded-xl border border-border bg-card p-4 shadow-soft hover:border-primary">
                  <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{work.yearLabel}</p>
                  <p className="mt-2 font-serif text-lg leading-tight">{work.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{authorById(work.authorId)?.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}

function WorkRow({ work }: { work: Work }) {
  return (
    <li className="py-3">
      <Link to={`/book/${work.textId ?? work.id}`} className="font-serif text-xl hover:text-primary">
        {work.title}
      </Link>
      <p className="text-sm text-muted-foreground">{authorById(work.authorId)?.name}</p>
    </li>
  )
}
