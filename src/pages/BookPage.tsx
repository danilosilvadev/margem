import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { authorById, workById, worksByAuthor, WORKS } from "@shared/canon"
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
  const work = workById(bookId) ?? WORKS.find((item) => item.textId === bookId)
  const author = work ? authorById(work.authorId) : undefined

  useEffect(() => {
    let cancel = false
    setError(null)
    void loadCatalog()
      .then((books) => {
        const found = books.find((item) => item.id === bookId) ?? null
        if (!found && !workById(bookId)) throw new Error("That book is not in the catalog.")
        if (!cancel) {
          setBook(found)
          document.title = `${found?.title.en ?? workById(bookId)?.title ?? "Book"} · ${brand.name}`
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
        <Link to="/" className="mt-4 inline-block text-sm text-primary">
          Back to the shelf
        </Link>
      </main>
    )
  }
  if (!book && !work) return <main className="mx-auto max-w-3xl px-5 py-16 text-muted-foreground">Fetching the book…</main>

  const chapter = book?.chapters[0]
  const title = book?.title.en ?? work?.title ?? ""
  const others = author ? worksByAuthor(author.id).filter((item) => item.id !== work?.id) : []
  const next = (work?.next ?? []).map((id) => workById(id)).filter((item) => item != null)

  return (
    <main className="mx-auto max-w-3xl px-5 py-10" data-testid="book-detail">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">{book?.year ?? work?.yearLabel}</p>
      <h1 className="mt-2 font-serif text-5xl leading-none">{title}</h1>
      {book ? (
        <>
          <p className="mt-3 font-serif text-2xl text-muted-foreground">{book.title.pt}</p>
          <p className="font-serif text-2xl text-muted-foreground">{book.title.es}</p>
        </>
      ) : (
        <p className="mt-3 text-muted-foreground">{work?.language}</p>
      )}
      <ul className="mt-6 space-y-1 text-sm">
        {book
          ? book.authors.map((person) => (
              <li key={`${person.role}-${person.name}`}>
                <span className="text-muted-foreground">{person.role}. </span>
                {person.name}
                {person.years ? <span className="text-muted-foreground"> ({person.years})</span> : null}
              </li>
            ))
          : author ? (
              <li>
                {author.name} <span className="text-muted-foreground">({author.life})</span>
              </li>
            ) : null}
      </ul>
      <p className="mt-6 max-w-prose text-lg">{book?.summary ?? work?.synopsis}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {chapter ? (
          <Button asChild>
            <Link to={`/read/${book?.id}/${chapter.id}`}>Start reading</Link>
          </Button>
        ) : null}
        <Button
          variant="line"
          onClick={() => {
            void toggleOnShelf(bookId, !onShelf).then(() => setOnShelf((value) => !value))
          }}
        >
          {onShelf ? "Remove from shelf" : "Keep on my shelf"}
        </Button>
      </div>
      {book ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {offlineReady ? "The text is stored on this device for offline reading." : "The text downloads when you open it, then stays available offline."}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">The full text is not on this device. The note below is metadata, not the work.</p>
      )}

      {work ? (
        <section className="mt-12 space-y-4">
          <h2 className="font-serif text-2xl">The work</h2>
          <p>{work.synopsis}</p>
          <p className="text-sm text-muted-foreground">{work.publicDomain}</p>
        </section>
      ) : null}

      {author ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl">{author.name}</h2>
          <p className="mt-2">{author.bio}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {author.birthplace}. {author.placeNote}
          </p>
          {others.length > 0 ? (
            <ul className="mt-3 text-sm">
              {others.map((item) => (
                <li key={item.id}>
                  <Link className="text-primary" to={`/book/${item.textId ?? item.id}`}>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {work && work.scenes.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl">Places the text names</h2>
          <ul className="mt-3 space-y-3">
            {work.scenes.map((scene) => (
              <li key={scene.name} className="rounded-xl border border-border bg-card p-4">
                <p className="font-serif">{scene.name}</p>
                <p className="text-sm text-muted-foreground">{scene.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {next.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl">What to open next</h2>
          <ul className="mt-3 space-y-2">
            {next.map((item) => (
              <li key={item.id}>
                <Link className="font-serif text-lg text-primary" to={`/book/${item.textId ?? item.id}`}>
                  {item.title}
                </Link>
                <span className="text-sm text-muted-foreground"> · {authorById(item.authorId)?.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {book ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl">Chapters</h2>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {book.chapters.map((item, index) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 py-3">
                <Link to={`/read/${book.id}/${item.id}`} className="hover:text-primary">
                  <span className="mr-3 text-muted-foreground">{index + 1}</span>
                  {item.title.en}
                </Link>
                <span className="text-sm text-muted-foreground">{item.paragraphCount} stanzas</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {book ? (
        <section className="mt-12 space-y-6">
          <h2 className="font-serif text-2xl">Why these texts are free to read</h2>
          {book.rights.map((right) => (
            <article key={right.lang}>
              <h3 className="text-sm tracking-wide text-muted-foreground uppercase">{LANG_LABEL[right.lang]}</h3>
              <p className="mt-1 font-medium">
                {right.title} — {right.credit}
              </p>
              <p className="text-sm text-muted-foreground">{right.edition}</p>
              <p className="mt-2 text-sm">{right.rationale}</p>
              <a className="text-sm text-primary underline-offset-2 hover:underline" href={right.source}>
                Source
              </a>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}
