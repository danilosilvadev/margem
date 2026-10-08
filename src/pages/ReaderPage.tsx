import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { splitHighlight } from "@shared/highlight"
import { LANG_LABEL, LANG_SHORT, type Book, type Lang } from "@shared/types"
import { brand } from "@shared/brand"
import {
  addHighlight,
  bookmarksFor,
  getProgress,
  highlightsFor,
  saveProgress,
  toggleBookmark,
  type StoredEvent,
} from "@/lib/db"
import { loadBook } from "@/lib/catalog"
import { useApp, useChapterThread } from "@/state/AppProvider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CommentDrawer, countFor } from "@/components/CommentDrawer"

type Popover = { x: number; y: number; quote: string; paragraphId: string; lang: Lang }

export function ReaderPage() {
  const { bookId = "", chapterId = "" } = useParams()
  const navigate = useNavigate()
  const app = useApp()
  const refreshRef = useRef(app.refresh)
  refreshRef.current = app.refresh
  const watchRef = useRef(app.watchChapter)
  watchRef.current = app.watchChapter
  const [book, setBook] = useState<Book | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(!navigator.onLine)
  const [marks, setMarks] = useState<string[]>([])
  const [highlights, setHighlights] = useState<Awaited<ReturnType<typeof highlightsFor>>>([])
  const [popover, setPopover] = useState<Popover | null>(null)
  const [commentsFor, setCommentsFor] = useState<string | null | "chapter">(null)
  const [marksOpen, setMarksOpen] = useState(false)
  const narrow = useMediaQuery("(max-width: 767px)")
  const touch = useRef<{ x: number; y: number } | null>(null)
  const { comments } = useChapterThread(bookId, chapterId)

  useEffect(() => watchRef.current(bookId, chapterId), [bookId, chapterId])

  useEffect(() => {
    let cancel = false
    setError(null)
    void loadBook(bookId)
      .then((next) => {
        if (cancel) return
        setBook(next)
        document.title = `${next.title.en} · ${brand.name}`
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "This book is not available offline yet")
      })
    return () => {
      cancel = true
    }
  }, [bookId])

  useEffect(() => {
    let cancel = false
    void bookmarksFor(bookId).then((rows) => {
      if (!cancel) setMarks(rows.map((row) => row.paragraphId))
    })
    void highlightsFor(bookId).then((rows) => {
      if (!cancel) setHighlights(rows.filter((row) => row.chapterId === chapterId))
    })
    return () => {
      cancel = true
    }
  }, [bookId, chapterId, app.tick])

  useEffect(() => {
    const on = () => setOffline(true)
    const off = () => setOffline(false)
    window.addEventListener("offline", on)
    window.addEventListener("online", off)
    return () => {
      window.removeEventListener("offline", on)
      window.removeEventListener("online", off)
    }
  }, [])

  const chapter = book?.chapters.find((item) => item.id === chapterId) ?? book?.chapters[0]
  const chapterIndex = book && chapter ? book.chapters.findIndex((item) => item.id === chapter.id) : -1

  useEffect(() => {
    if (!chapter) return
    const hash = location.hash.replace("#", "")
    const target = hash || null
    void getProgress(bookId).then((progress) => {
      const id = target || (progress?.chapterId === chapter.id ? progress.paragraphId : "")
      if (!id) return
      document.getElementById(id)?.scrollIntoView({ block: "center" })
    })
  }, [bookId, chapter])

  useEffect(() => {
    if (!chapter) return
    const nodes = document.querySelectorAll<HTMLElement>("[data-paragraph]")
    let timer = 0
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        const id = visible?.target.getAttribute("data-paragraph")
        if (!id) return
        window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          void saveProgress({ bookId, chapterId: chapter.id, paragraphId: id, updatedAt: Date.now() }).then((changed) => {
            if (changed) refreshRef.current()
          })
        }, 500)
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0.2 },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [bookId, chapter, narrow, app.settings.columns, app.settings.mobileMode])

  const langs = narrow
    ? app.settings.mobileMode === "focus"
      ? [app.settings.focusLang]
      : unique(app.settings.columnLangs)
    : unique(app.settings.columnLangs.slice(0, app.settings.columns))

  function cycleTheme() {
    const order = ["light", "sepia", "dark"] as const
    const next = order[(order.indexOf(app.settings.theme) + 1) % order.length]
    void app.updateSettings({ theme: next })
  }

  function onPointerDown(event: ReactPointerEvent) {
    if (!narrow || app.settings.mobileMode !== "focus") return
    touch.current = { x: event.clientX, y: event.clientY }
  }

  function onPointerUp(event: ReactPointerEvent) {
    const start = touch.current
    touch.current = null
    if (!start || !narrow || app.settings.mobileMode !== "focus") return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return
    const order = unique(app.settings.columnLangs)
    const index = order.indexOf(app.settings.focusLang)
    const next = order[(index + (dx < 0 ? 1 : order.length - 1)) % order.length]
    void app.updateSettings({ focusLang: next })
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <p role="alert">{error}</p>
        <Link to="/" className="mt-4 inline-block text-accent">
          Back to the shelf
        </Link>
      </main>
    )
  }
  if (!book || !chapter) return <main className="px-5 py-16 text-muted">Opening the text…</main>

  const commentEvents = comments as StoredEvent[]

  return (
    <div data-testid="reader">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2">
          <Link to={`/book/${book.id}`} className="text-sm text-muted hover:text-ink">
            {book.title.en}
          </Link>
          <span className="hidden text-muted sm:inline">/</span>
          <label className="text-sm">
            <span className="sr-only">Chapter</span>
            <select
              className="bg-transparent"
              value={chapter.id}
              onChange={(event) => {
                navigate(`/read/${book.id}/${event.target.value}`)
              }}
            >
              {book.chapters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title.en}
                </option>
              ))}
            </select>
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-1">
            <span className="px-2 text-xs text-muted" data-testid="sync-status">
              {app.syncStatus === "open"
                ? app.directPeers > 0
                  ? `Relay · ${app.directPeers} direct`
                  : "Relay"
                : offline
                  ? "Offline"
                  : "Saved here"}
            </span>
            <Button size="sm" variant="quiet" onClick={() => setCommentsFor("chapter")} data-testid="open-chapter-comments">
              Notes
            </Button>
            <Button size="sm" variant="quiet" onClick={() => setMarksOpen(true)}>
              Marks
            </Button>
            {narrow ? (
              <>
                <Button
                  size="sm"
                  variant={app.settings.mobileMode === "stack" ? "default" : "line"}
                  onClick={() => void app.updateSettings({ mobileMode: "stack" })}
                >
                  Stacked
                </Button>
                <Button
                  size="sm"
                  variant={app.settings.mobileMode === "focus" ? "default" : "line"}
                  onClick={() => void app.updateSettings({ mobileMode: "focus" })}
                >
                  One
                </Button>
              </>
            ) : (
              ([1, 2, 3] as const).map((count) => (
                <Button
                  key={count}
                  size="sm"
                  variant={app.settings.columns === count ? "default" : "line"}
                  onClick={() => void app.updateSettings({ columns: count })}
                  aria-label={`${count} columns`}
                >
                  {count}
                </Button>
              ))
            )}
            <Button size="sm" variant="quiet" onClick={() => void app.updateSettings({ fontSize: Math.max(16, app.settings.fontSize - 1) })} aria-label="Smaller text">
              A−
            </Button>
            <Button size="sm" variant="quiet" onClick={() => void app.updateSettings({ fontSize: Math.min(26, app.settings.fontSize + 1) })} aria-label="Larger text">
              A+
            </Button>
            <Button size="sm" variant="quiet" onClick={cycleTheme} data-testid="theme-toggle">
              {app.settings.theme}
            </Button>
            <Link to="/settings" className="px-2 text-sm text-muted hover:text-ink">
              Settings
            </Link>
          </div>
        </div>
        {narrow && app.settings.mobileMode === "focus" ? (
          <div className="flex justify-center gap-2 px-4 pb-2">
            {unique(app.settings.columnLangs).map((lang) => (
              <button
                key={lang}
                className={`rounded-full px-3 py-1 text-xs ${app.settings.focusLang === lang ? "bg-accent text-paper" : "text-muted"}`}
                onClick={() => void app.updateSettings({ focusLang: lang })}
              >
                {LANG_LABEL[lang]}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {offline ? (
        <p className="bg-accent-soft px-4 py-2 text-center text-sm">You are offline. This copy stays readable. New notes wait on this device.</p>
      ) : null}

      <article
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
        style={{ fontSize: app.settings.fontSize }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {!narrow ? (
          <div
            className="mb-2 grid gap-8"
            style={{ gridTemplateColumns: `repeat(${langs.length}, minmax(0, 1fr))` }}
          >
            {langs.map((lang, index) => (
              <label key={`${lang}-${index}`} className="text-xs tracking-[0.16em] text-muted uppercase">
                <span className="sr-only">Column {index + 1} language</span>
                <select
                  className="bg-transparent"
                  value={lang}
                  data-testid="column"
                  onChange={(event) => {
                    const columnLangs = [...app.settings.columnLangs] as [Lang, Lang, Lang]
                    columnLangs[index] = event.target.value as Lang
                    void app.updateSettings({ columnLangs })
                  }}
                >
                  {book.languages.map((option) => (
                    <option key={option} value={option}>
                      {LANG_LABEL[option]}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}

        {chapter.paragraphs.map((paragraph, index) => (
          <section key={paragraph.id} id={paragraph.id} data-paragraph={paragraph.id} className="border-b border-line/80 py-7">
            <div className="mb-3 flex items-center gap-3 text-xs text-muted">
              <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              <button
                className={marks.includes(paragraph.id) ? "text-accent" : "hover:text-ink"}
                onClick={() => {
                  void toggleBookmark({
                    id: `${book.id}:${chapter.id}:${paragraph.id}`,
                    bookId: book.id,
                    chapterId: chapter.id,
                    paragraphId: paragraph.id,
                  }).then(() => app.refresh())
                }}
              >
                {marks.includes(paragraph.id) ? "Bookmarked" : "Bookmark"}
              </button>
              <button data-testid={`comments-${paragraph.id}`} onClick={() => setCommentsFor(paragraph.id)} className="hover:text-ink">
                Notes {countFor(commentEvents, paragraph.id) || ""}
              </button>
            </div>
            <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${langs.length}, minmax(0, 1fr))` }}>
              {langs.map((lang) => (
                <div
                  key={lang}
                  lang={lang}
                  data-lang={lang}
                  onMouseUp={() => {
                    const selection = window.getSelection()
                    const quote = selection?.toString().trim() ?? ""
                    if (!selection || selection.isCollapsed || !quote || quote.length > 400) {
                      return
                    }
                    const rect = selection.getRangeAt(0).getBoundingClientRect()
                    setPopover({ x: rect.left, y: rect.bottom + 8, quote, paragraphId: paragraph.id, lang })
                  }}
                >
                  {narrow && app.settings.mobileMode === "stack" ? (
                    <p className="mb-1 text-[0.65em] tracking-[0.16em] text-muted uppercase">{LANG_SHORT[lang]}</p>
                  ) : null}
                  <p className="reading whitespace-pre-line">
                    {splitHighlight(
                      paragraph[lang] ?? "",
                      highlights.filter((item) => item.paragraphId === paragraph.id && item.lang === lang).map((item) => item.quote),
                    ).map((run, runIndex) =>
                      run.hit ? (
                        <mark key={runIndex} className="bg-highlight text-inherit">
                          {run.text}
                        </mark>
                      ) : (
                        <span key={runIndex}>{run.text}</span>
                      ),
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <nav className="mt-8 flex justify-between text-sm">
          {chapterIndex > 0 ? (
            <Link to={`/read/${book.id}/${book.chapters[chapterIndex - 1].id}`}>Previous chapter</Link>
          ) : (
            <span />
          )}
          {book.chapters[chapterIndex + 1] ? (
            <Link to={`/read/${book.id}/${book.chapters[chapterIndex + 1].id}`}>Next chapter</Link>
          ) : (
            <span className="text-muted">End of the text</span>
          )}
        </nav>
      </article>

      {popover ? (
        <button
          className="fixed z-30 rounded-full bg-accent px-3 py-1 text-sm text-paper"
          style={{ left: popover.x, top: popover.y }}
          onClick={() => {
            const text = chapter.paragraphs.find((item) => item.id === popover.paragraphId)?.[popover.lang] ?? ""
            if (!text.includes(popover.quote)) {
              setPopover(null)
              return
            }
            void addHighlight({
              id: crypto.randomUUID(),
              bookId: book.id,
              chapterId: chapter.id,
              paragraphId: popover.paragraphId,
              lang: popover.lang,
              quote: popover.quote,
              createdAt: Date.now(),
            }).then(() => {
              window.getSelection()?.removeAllRanges()
              setPopover(null)
              app.refresh()
            })
          }}
        >
          Highlight
        </button>
      ) : null}

      <CommentDrawer
        open={commentsFor !== null}
        onOpenChange={(open) => {
          if (!open) setCommentsFor(null)
        }}
        bookId={book.id}
        chapterId={chapter.id}
        paragraphId={commentsFor && commentsFor !== "chapter" ? commentsFor : null}
        heading={commentsFor && commentsFor !== "chapter" ? `Stanza ${commentsFor.replace("s", "")}` : chapter.title.en}
      />

      <Dialog open={marksOpen} onOpenChange={setMarksOpen}>
        <DialogContent title="Bookmarks" description="Passages you marked in this book.">
          {marks.length === 0 ? <p className="text-sm text-muted">No bookmarks yet. Mark a stanza and it will wait here.</p> : null}
          <ul className="space-y-2">
            {marks.map((id) => (
              <li key={id}>
                <button
                  className="text-left hover:text-accent"
                  onClick={() => {
                    setMarksOpen(false)
                    document.getElementById(id)?.scrollIntoView({ block: "center" })
                  }}
                >
                  Stanza {id.replace("s", "")}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function unique(langs: Lang[]): Lang[] {
  const seen = new Set<Lang>()
  const out: Lang[] = []
  for (const lang of langs) {
    if (seen.has(lang)) continue
    seen.add(lang)
    out.push(lang)
  }
  return out
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [query])
  return matches
}
