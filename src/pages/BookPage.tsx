import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, BookMarked, BookOpen, Clock, MapPin, Quote, Sparkles, Users } from "lucide-react"
import { authorById, ERAS, SALONS, workById, WORKS, worksByAuthor } from "@shared/canon"
import { bookProfile } from "@shared/book-profile"
import { brand } from "@shared/brand"
import { marginalia, readingRooms } from "@shared/community"
import { KIND, tagValue } from "@shared/events"
import { displayNames, visibleComments } from "@shared/merge"
import { LANG_LABEL, type CatalogBook } from "@shared/types"
import { BookSceneMap } from "@/components/BookSceneMap"
import { GeneratedCover } from "@/components/GeneratedCover"
import { Button } from "@/components/ui/button"
import { bookmarksFor, cachedBook, getProgress, getShelf, highlightsFor, allEvents, type StoredEvent } from "@/lib/db"
import { loadBook, loadCatalog } from "@/lib/catalog"
import { identiconCells, penName } from "@/lib/pen-name"
import { useApp } from "@/state/AppProvider"

function monogram(name: string): string {
  const skip = new Set(["de", "von", "of", "the"])
  const parts = name.split(" ").filter((part) => part && !skip.has(part.toLowerCase()))
  const letters = parts.length <= 1 ? (parts[0] ?? name).slice(0, 2) : `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`
  return letters.toUpperCase()
}

export function BookPage() {
  const { bookId = "" } = useParams()
  const { toggleOnShelf, tick, publishCommunity, publishComment, syncStatus, ownerPubkey, watchBook, identity } = useApp()
  const [book, setBook] = useState<CatalogBook | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [onShelf, setOnShelf] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [stats, setStats] = useState({ bookmarks: 0, highlights: 0, chapter: "", updatedAt: 0 })
  const [events, setEvents] = useState<StoredEvent[]>([])
  const [quote, setQuote] = useState("")
  const [note, setNote] = useState("")
  const [talk, setTalk] = useState("")
  const work = workById(bookId) ?? WORKS.find((item) => item.textId === bookId)
  const author = work ? authorById(work.authorId) : undefined
  const profile = work ? bookProfile(work.id) : undefined

  useEffect(() => {
    let cancel = false
    setError(null)
    setReady(false)
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
        if (cancel) return
        if (!workById(bookId)) setError(reason instanceof Error ? reason.message : "Could not open this book")
      })
      .finally(() => {
        if (!cancel) setReady(true)
      })
    void getShelf().then((items) => {
      if (!cancel) setOnShelf(items.some((item) => item.bookId === bookId))
    })
    void Promise.all([getProgress(bookId), bookmarksFor(bookId), highlightsFor(bookId)]).then(([progress, marks, highlights]) => {
      if (cancel) return
      setStats({
        bookmarks: marks.length,
        highlights: highlights.length,
        chapter: progress?.chapterId ?? "",
        updatedAt: progress?.updatedAt ?? 0,
      })
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

  useEffect(() => {
    let cancel = false
    void allEvents().then((rows) => {
      if (!cancel) setEvents(rows)
    })
    return () => {
      cancel = true
    }
  }, [bookId, tick])

  useEffect(() => watchBook(bookId), [bookId, watchBook])

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p role="alert">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary">
          Back to the catalog
        </Link>
      </main>
    )
  }
  if (!ready && !work) return <main className="mx-auto max-w-3xl px-5 py-16 text-center text-muted-foreground">Loading…</main>
  if (!work && !book) return <main className="mx-auto max-w-3xl px-5 py-16 text-center text-muted-foreground">That book is not in the catalog.</main>

  const chapter = book?.chapters[0]
  const title = book?.title.en ?? work?.title ?? ""
  const authorName = author?.name ?? book?.authors[0]?.name ?? ""
  const yearLabel = book?.year != null ? String(book.year) : work?.yearLabel
  const genre = work?.genre
  const language = work?.language ?? (book ? "Parallel text" : "")
  const synopsis = work?.synopsis ?? book?.summary ?? ""
  const era = author ? ERAS.find((item) => item.id === author.era) : undefined
  const salons = work ? SALONS.filter((salon) => salon.workIds.includes(work.id)) : []
  const nextIds = work?.next ?? []
  const related = relatedWorks(work?.id ?? bookId, genre, language, nextIds)
  const names = displayNames(events, ownerPubkey)
  const marks = marginalia(events, ownerPubkey).filter((item) => item.bookId === (work?.id ?? bookId))
  const rooms = readingRooms(events, ownerPubkey).filter((item) => item.bookId === (work?.id ?? bookId))
  const comments = visibleComments(events, ownerPubkey).filter((event) => tagValue(event, "b") === (work?.id ?? bookId))
  const relay =
    syncStatus === "open"
      ? "Relay connected. A note signed here can reach anyone else who has this book open."
      : syncStatus === "connecting"
        ? "Connecting. A note you sign is kept on this device either way."
        : "Relay offline. A note you sign stays on this device until a relay answers."

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8" data-testid="book-profile">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to the catalog
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        <GeneratedCover bookId={work?.id ?? bookId} title={title} author={authorName} className="h-56 w-40 shrink-0 rounded-lg ring-1 ring-border" />
        <div className="space-y-3">
          <h1 className="font-serif text-3xl leading-tight font-bold md:text-4xl">{title}</h1>
          {authorName ? <p className="font-sans text-lg text-muted-foreground">{authorName}</p> : null}
          <div className="flex flex-wrap gap-2">
            {author?.country ? <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{author.country}</span> : null}
            {genre ? <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">{genre}</span> : null}
            {yearLabel ? <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">{yearLabel}</span> : null}
            {language ? <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">{language}</span> : null}
            {book ? <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">{book.chapters.length} chapters</span> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <BookMarked className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="sr-only">Shelf</span>
              <select
                aria-label="Shelf"
                value={onShelf ? "shelf" : "off"}
                className="rounded-md border border-border bg-background px-2 py-1.5"
                onChange={(event) => {
                  const next = event.target.value === "shelf"
                  void toggleOnShelf(bookId, next).then(() => setOnShelf(next))
                }}
              >
                <option value="off">Not on my shelf</option>
                <option value="shelf">On my shelf</option>
              </select>
            </label>
            {chapter ? (
              <Button asChild>
                <Link to={`/read/${book?.id}/${chapter.id}`}>
                  <BookOpen className="size-4" aria-hidden="true" /> Start reading
                </Link>
              </Button>
            ) : (
              <Button disabled>Text not on this device</Button>
            )}
          </div>
          {salons.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {salons.map((salon) => (
                <Link key={salon.id} to={`/salon/${salon.id}`} className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">
                  {salon.icon} {salon.name}
                </Link>
              ))}
            </div>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {chapter
              ? offlineReady
                ? "The text is stored on this device for offline reading."
                : "The text downloads when you open it, then stays available offline."
              : "The full text is not on this device. What follows is the work, not a substitute for it."}
          </p>
        </div>
      </div>

      {synopsis ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-serif text-base">Synopsis</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{synopsis}</p>
        </section>
      ) : null}

      {profile ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-serif text-base">
            <MapPin className="size-4 text-primary" aria-hidden="true" /> Places in the work
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">The places, real and imagined, where the book happens. Tap a real place to mark it.</p>
          <div className="mt-3">
            <BookSceneMap profile={profile} />
          </div>
        </section>
      ) : null}

      {profile ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-serif text-base">
            <Clock className="size-4 text-primary" aria-hidden="true" /> Historical context
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">When this was written, and what was at stake.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.context}</p>
        </section>
      ) : null}

      {profile && profile.themes.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-serif text-base">Themes</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.themes.map((theme) => (
              <li key={theme} className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-sm">
                {theme}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile && profile.characters.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-serif text-base">
            <Users className="size-4 text-primary" aria-hidden="true" /> Characters
          </h2>
          <ul className="mt-3 space-y-3">
            {profile.characters.map((person) => (
              <li key={person.name}>
                <p className="font-serif">{person.name}</p>
                <p className="text-sm text-muted-foreground">{person.note}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile && profile.quotes.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-serif text-base">
            <Quote className="size-4 text-primary" aria-hidden="true" /> From the text
          </h2>
          <div className="mt-3 space-y-4">
            {profile.quotes.map((item) => (
              <blockquote key={item.cite} className="border-l-2 border-gold pl-4">
                <p className="font-serif text-lg leading-snug">“{item.text}”</p>
                <footer className="mt-1 text-xs text-muted-foreground">{item.cite}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}

      {profile && era ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-serif text-base">Era</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {era.name}. {era.range}.
          </p>
          <ol className="mt-4 space-y-3 border-l border-gold/50 pl-4">
            {profile.timeline.map((item) => (
              <li key={item.label}>
                <p className="font-serif text-sm">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-serif text-base">
            <Sparkles className="size-4 text-primary" aria-hidden="true" /> What to read next
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((item) => {
              const person = authorById(item.authorId)
              return (
                <Link key={item.id} to={`/book/${item.textId ?? item.id}`} className="group flex flex-col gap-1.5 hover:opacity-80">
                  <GeneratedCover bookId={item.id} title={item.title} author={person?.name} className="aspect-[2/3] w-full rounded ring-1 ring-border" />
                  <p className="line-clamp-2 font-serif text-[11px] leading-tight font-semibold">{item.title}</p>
                  <p className="line-clamp-1 text-[10px] text-muted-foreground">{person?.name}</p>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {author ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-serif text-base">About the author</h2>
          <div className="mt-3 flex gap-4">
            <div
              className="grid size-24 shrink-0 place-items-center rounded-lg bg-wine-dark font-serif text-2xl text-gold shadow-soft ring-1 ring-border sm:size-28"
              aria-hidden="true"
            >
              {monogram(author.name)}
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="font-serif font-semibold">{author.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {author.country ? <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{author.country}</span> : null}
                <span className="rounded-full border border-border px-2 py-0.5 text-xs">{author.life}</span>
                {era ? <span className="rounded-full border border-border px-2 py-0.5 text-xs">{era.range}</span> : null}
              </div>
              <p className="pt-1 text-sm leading-relaxed text-muted-foreground">{author.bio}</p>
              <p className="text-sm text-muted-foreground">
                {author.birthplace}. {author.placeNote}
              </p>
              <ul className="text-sm">
                {worksByAuthor(author.id)
                  .filter((item) => item.id !== work?.id)
                  .map((item) => (
                    <li key={item.id}>
                      <Link className="text-primary" to={`/book/${item.textId ?? item.id}`}>
                        {item.title}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft" data-testid="reading-stats">
        <h2 className="font-serif text-base">On this device</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Shelf</dt>
            <dd className="font-serif text-lg">{onShelf ? "Kept" : "Not kept"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Place</dt>
            <dd className="font-serif text-lg">{stats.chapter ? "Opened" : "Not opened"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Bookmarks</dt>
            <dd className="font-serif text-lg">{stats.bookmarks}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Highlights</dt>
            <dd className="font-serif text-lg">{stats.highlights}</dd>
          </div>
        </dl>
        {stats.updatedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">Last opened {new Date(stats.updatedAt).toLocaleDateString("en")}</p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Nothing from this book has been marked here yet.</p>
        )}
        {chapter && stats.chapter ? (
          <Button asChild className="mt-3" variant="line" size="sm">
            <Link to={`/read/${book?.id}/${stats.chapter}`}>Continue</Link>
          </Button>
        ) : null}
      </section>

      <section className="space-y-4" data-testid="book-community">
        <h2 className="font-serif text-2xl">Marginalia and discussion</h2>
        <p className="text-sm text-muted-foreground" data-testid="book-relay">
          {relay} Signed with {identity.displayName || "your reading key"}. No account.
        </p>
        <form
          className="space-y-2 rounded-2xl border border-border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!quote.trim() && !note.trim()) return
            void publishCommunity({
              kind: KIND.marginalia,
              tags: [["b", work?.id ?? bookId]],
              content: JSON.stringify({ quote: quote.trim(), note: note.trim() }),
            }).then(() => {
              setQuote("")
              setNote("")
            })
          }}
        >
          <h3 className="font-serif">A mark in the margin</h3>
          <textarea value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="The line" className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2" />
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What you want beside it" className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2" />
          <Button type="submit">Sign this mark</Button>
        </form>
        {marks.length === 0 ? <p className="text-sm text-muted-foreground">No marginalia for this book on this device yet.</p> : null}
        {marks.map((mark) => (
          <article key={mark.id} className="rounded-xl border border-gold/30 bg-card p-4" data-testid="book-marginalia">
            {mark.quote ? <p className="font-serif">“{mark.quote}”</p> : null}
            {mark.note ? <p className="mt-2 text-sm">{mark.note}</p> : null}
            <ReaderLine pubkey={mark.pubkey} fallback={names.get(mark.pubkey)} />
          </article>
        ))}

        <form
          className="space-y-2 rounded-2xl border border-border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!talk.trim()) return
            void publishComment({ bookId: work?.id ?? bookId, chapterId: "profile", content: talk.trim() }).then(() => setTalk(""))
          }}
        >
          <h3 className="font-serif">Talk about the book</h3>
          <textarea value={talk} onChange={(event) => setTalk(event.target.value)} placeholder="A note for other readers of this book" className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2" />
          <Button type="submit">Sign this note</Button>
        </form>
        {comments.length === 0 ? <p className="text-sm text-muted-foreground">No signed notes for this book yet.</p> : null}
        {comments.map((event) => (
          <article key={event.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm whitespace-pre-wrap">{event.content}</p>
            <ReaderLine pubkey={event.pubkey} fallback={names.get(event.pubkey)} suffix={tagValue(event, "c") === "profile" ? "on this page" : "in the text"} />
          </article>
        ))}
        {rooms.length > 0 ? (
          <div className="space-y-2">
            <h3 className="font-serif">Reading rooms for this book</h3>
            {rooms.map((room) => (
              <article key={room.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-serif">{room.title}</p>
                {room.note ? <p className="mt-1 text-sm text-muted-foreground">{room.note}</p> : null}
                <ReaderLine pubkey={room.pubkey} fallback={names.get(room.pubkey)} />
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {book ? (
        <section>
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

      {work ? <p className="text-sm text-muted-foreground">{work.publicDomain}</p> : null}

      {book ? (
        <section className="space-y-6">
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

function relatedWorks(id: string, genre: string | undefined, language: string | undefined, next: string[]) {
  const chosen = []
  const seen = new Set<string>([id])
  for (const itemId of next) {
    const item = workById(itemId)
    if (!item || seen.has(item.id)) continue
    seen.add(item.id)
    chosen.push(item)
  }
  for (const item of WORKS) {
    if (chosen.length >= 4) break
    if (seen.has(item.id)) continue
    if (item.genre === genre || item.language === language) {
      seen.add(item.id)
      chosen.push(item)
    }
  }
  return chosen.slice(0, 4)
}

function ReaderLine({ pubkey, fallback, suffix }: { pubkey: string; fallback?: string; suffix?: string }) {
  const name = fallback?.trim() || penName(pubkey)
  const cells = identiconCells(pubkey)
  return (
    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" title={pubkey}>
      <svg viewBox="0 0 5 5" className="size-6 shrink-0 rounded bg-wine-dark" aria-hidden="true">
        {cells.map((on, index) =>
          on ? <rect key={index} x={index % 5} y={Math.floor(index / 5)} width="1" height="1" fill="hsl(42 70% 55%)" /> : null,
        )}
      </svg>
      <span>
        {name}
        {suffix ? ` · ${suffix}` : ""}
      </span>
    </p>
  )
}
