import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpenText, ChevronDown, ChevronLeft, ChevronRight, Compass, Info, Maximize2, Minimize2, Pause, Play, Quote, Sparkles, X } from "lucide-react"
import { ERAS, eraOf, formatMark, formatRange, formatYear, type Era } from "@shared/literary-canon"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { coverDataUri } from "@/lib/cover-uri"
import { shelfBooks, type ShelfBook } from "@/lib/shelf-books"
import { Button } from "@/components/ui/button"

const ERA_WIDTH = 1100
const PLAY_SPEED = 1.5
const SPEEDS = [0.5, 1, 2] as const

export function JourneyPage() {
  const books = useMemo(() => shelfBooks().filter((book) => Number.isFinite(book.publicationYear)), [])
  const [fullscreen, setFullscreen] = useState(false)
  return (
    <div data-testid="literary-journey" className="-mb-20 flex h-[calc(100dvh-7rem)] flex-col overflow-hidden bg-gradient-to-br from-wine-dark via-wine to-wine-dark md:-mb-8 md:h-[calc(100dvh-3.5rem)]">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gold/30 bg-gradient-to-b from-wine-dark/80 to-transparent px-4 py-3 sm:px-6">
        <LiteraryTabs variant="dark" />
        <Button size="sm" variant="quiet" className="ml-auto h-8 text-cream hover:bg-cream/10 hover:text-cream" onClick={() => setFullscreen(true)}>
          <Maximize2 className="size-4" />
          <span className="hidden sm:inline">Full screen</span>
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <Timeline books={books} />
      </div>
      {fullscreen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-wine-dark via-wine to-wine-dark">
          <div className="flex shrink-0 items-center gap-3 border-b border-gold/30 px-4 py-3">
            <Compass className="size-5 text-gold" />
            <h2 className="font-serif text-base font-bold text-cream sm:text-lg">Journey through Literature</h2>
            <p className="hidden text-[11px] text-cream/60 md:block">
              {books.length} works · {ERAS.length} eras
            </p>
            <Button size="sm" variant="quiet" className="ml-auto h-8 text-cream hover:bg-cream/10" onClick={() => setFullscreen(false)}>
              <Minimize2 className="size-4" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
            <button type="button" className="rounded-full p-2 text-cream hover:bg-cream/10" onClick={() => setFullscreen(false)} aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Timeline books={books} fullscreen />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Timeline({ books, fullscreen = false }: { books: ShelfBook[]; fullscreen?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [scrollX, setScrollX] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const [story, setStory] = useState<Era | null>(null)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [narrate, setNarrate] = useState(true)
  const [help, setHelp] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const raf = useRef<number | null>(null)
  const prevEra = useRef(0)
  const didInit = useRef(false)
  const sawFullscreen = useRef(false)

  const placed = useMemo(() => {
    const sorted = [...books].sort((a, b) => a.publicationYear - b.publicationYear)
    const lanes: number[] = []
    return sorted.map((book) => {
      const x = yearToX(book.publicationYear)
      let lane = 0
      while (lane < lanes.length && lanes[lane] + 58 > x) lane += 1
      if (lane >= lanes.length) lanes.push(x)
      else lanes[lane] = x
      return { book, x, lane }
    })
  }, [books])

  const width = ERAS.length * ERA_WIDTH
  const eraIndex = Math.min(ERAS.length - 1, Math.max(0, Math.floor((scrollX + 200) / ERA_WIDTH)))
  const current = ERAS[eraIndex]
  const viewport = scroller.current?.clientWidth ?? 800
  const year = xToYear(scrollX + viewport / 2)
  const running = playing && !story

  useEffect(() => {
    if (!running) {
      if (raf.current) cancelAnimationFrame(raf.current)
      return
    }
    const step = () => {
      const el = scroller.current
      if (!el) return
      el.scrollLeft += PLAY_SPEED * speed
      setScrollX(el.scrollLeft)
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) {
        setPlaying(false)
        return
      }
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [running, speed])

  useEffect(() => {
    if (eraIndex === prevEra.current) return
    const next = ERAS[eraIndex]
    if (narrate && playing && !seen.has(next.id)) {
      setStory(next)
      setSeen((currentSeen) => new Set(currentSeen).add(next.id))
    }
    prevEra.current = eraIndex
  }, [eraIndex, narrate, playing, seen])

  useEffect(() => {
    const el = scroller.current
    if (!el || didInit.current || placed.length === 0) return
    const target = Math.max(0, placed[0].x - 180)
    el.scrollLeft = target
    setScrollX(target)
    didInit.current = true
  }, [placed])

  useEffect(() => {
    if (!sawFullscreen.current) {
      sawFullscreen.current = true
      return
    }
    const el = scroller.current
    if (!el) return
    const target = placed.length ? Math.max(0, placed[0].x - 180) : 0
    el.scrollLeft = target
    setScrollX(target)
  }, [fullscreen, placed])

  useEffect(() => {
    if (!story) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setStory(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [story])

  function jump(index: number) {
    setPlaying(false)
    scroller.current?.scrollTo({ left: index * ERA_WIDTH, behavior: "smooth" })
  }

  function nudge(direction: 1 | -1) {
    setPlaying(false)
    scroller.current?.scrollBy({ left: direction * ERA_WIDTH * 0.6, behavior: "smooth" })
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-gold/20 bg-wine-dark/60 px-3 py-2 backdrop-blur-sm">
        <Button size="sm" variant={playing ? "default" : "quiet"} className={playing ? "" : "text-cream hover:bg-cream/10 hover:text-cream"} onClick={() => setPlaying((value) => !value)}>
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? "Pause" : "Start journey"}
        </Button>
        <div className="flex overflow-hidden rounded-md border border-gold/15 bg-cream/5">
          {SPEEDS.map((option) => (
            <button key={option} type="button" onClick={() => setSpeed(option)} className={`px-2 py-1 text-[10px] ${speed === option ? "bg-gold/20 font-semibold text-gold" : "text-cream/60"}`}>
              {option}x
            </button>
          ))}
        </div>
        <Button size="icon" variant="quiet" className="size-8 text-cream hover:bg-cream/10" onClick={() => nudge(-1)} aria-label="Previous">
          <ChevronLeft className="size-4" />
        </Button>
        <Button size="icon" variant="quiet" className="size-8 text-cream hover:bg-cream/10" onClick={() => nudge(1)} aria-label="Next">
          <ChevronRight className="size-4" />
        </Button>
        <button
          type="button"
          onClick={() => setNarrate((value) => !value)}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] ${narrate ? "border-gold/30 bg-gold/15 text-gold" : "border-cream/10 bg-cream/5 text-cream/50"}`}
        >
          <BookOpenText className="size-3" />
          <span className="hidden sm:inline">Narrate</span>
        </button>
        <div className="ml-1 flex shrink-0 gap-1">
          {ERAS.map((era, index) => (
            <button key={era.id} type="button" onClick={() => jump(index)} className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] whitespace-nowrap ${eraIndex === index ? "bg-gold font-semibold text-wine-dark" : "bg-cream/10 text-cream/70"}`}>
              {era.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-3 border-b border-gold/10 bg-wine-dark px-4 py-2.5">
        <div className="w-1 self-stretch rounded-full" style={{ background: current.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-serif text-sm font-bold text-cream">{current.name}</h3>
            <span className="text-[11px] text-cream/60">{formatRange(current.startYear, current.endYear)}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-cream/75">{current.summary}</p>
        </div>
      </div>
      <div
        ref={scroller}
        data-testid="timeline-scroller"
        className="relative min-h-0 flex-1 cursor-grab overflow-x-auto overflow-y-hidden bg-wine-dark active:cursor-grabbing"
        onScroll={() => scroller.current && setScrollX(scroller.current.scrollLeft)}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          drag.current = { x: event.clientX, left: scroller.current?.scrollLeft ?? 0, moved: false }
        }}
        onPointerMove={(event) => {
          if (!drag.current || !scroller.current) return
          const dx = event.clientX - drag.current.x
          if (!drag.current.moved && Math.abs(dx) < 6) return
          drag.current.moved = true
          scroller.current.scrollLeft = drag.current.left - dx
        }}
        onPointerUp={() => {
          if (!drag.current?.moved) drag.current = null
        }}
        onClickCapture={(event) => {
          if (drag.current?.moved) {
            event.preventDefault()
            event.stopPropagation()
          }
          drag.current = null
        }}
      >
        <div style={{ width, height: "100%", position: "relative" }}>
          {ERAS.map((era, index) => (
            <div key={era.id} className="absolute top-0 bottom-0" style={{ left: index * ERA_WIDTH, width: ERA_WIDTH, background: `linear-gradient(180deg, ${era.color}33, ${era.color}11 50%, ${era.color}33)`, borderRight: index < ERAS.length - 1 ? "1px dashed rgba(255,255,255,0.1)" : undefined }}>
              <div className="pointer-events-none absolute top-3 right-4 left-4">
                <p className="font-serif text-xs font-bold tracking-widest uppercase" style={{ color: era.ink }}>{era.name}</p>
                <p className="mt-0.5 text-[10px] opacity-70" style={{ color: era.ink }}>{formatRange(era.startYear, era.endYear)}</p>
              </div>
              <div className="pointer-events-none absolute right-4 bottom-3 left-4 flex flex-wrap gap-1.5">
                {era.marks.map((mark) => (
                  <span key={mark} className="rounded bg-black/30 px-1.5 py-0.5 text-[9px] backdrop-blur-sm" style={{ color: era.ink }}>
                    {formatMark(mark)}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="pointer-events-none absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-gold/40 to-transparent" style={{ width }} />
          {placed.map(({ book, x, lane }, index) => {
            const coverW = 50
            const coverH = 70
            const above = lane % 2 === 0
            const offset = (Math.floor(lane / 2) + 1) * (coverH + 18)
            const center = scrollX + viewport / 2
            const proximity = Math.max(0, 1 - Math.abs(x - center) / 600)
            return (
              <Link
                key={book.id}
                to={`/book/${book.id}`}
                className="group/book absolute hover:z-20"
                style={{ left: x - coverW / 2, top: above ? `calc(50% - ${offset}px)` : `calc(50% + ${offset - coverH}px)`, width: coverW, opacity: 0.25 + proximity * 0.75, transform: `scale(${0.9 + proximity * 0.1})` }}
                title={`${book.title} — ${book.authorName}`}
              >
                <span className="absolute left-1/2 w-px -translate-x-1/2 bg-gold/30 group-hover/book:bg-gold/80" style={{ height: offset, top: above ? coverH : -offset + coverH }} />
                <img src={coverDataUri(book.id, book.title, book.authorName)} alt={book.title} className="w-full rounded-sm object-cover shadow-lg ring-1 ring-gold/40 group-hover/book:scale-110" style={{ height: coverH }} />
                <span className="pointer-events-none absolute top-full left-1/2 z-30 mt-2 hidden w-44 -translate-x-1/2 rounded-md border border-gold/50 bg-wine-dark px-2 py-1.5 group-hover/book:block">
                  <span className="block truncate font-serif text-[10px] font-bold text-cream">{book.title}</span>
                  <span className="block text-[9px] text-cream/70">{book.authorName}</span>
                  <span className="block text-[9px] text-gold">{formatYear(book.publicationYear)}</span>
                </span>
                <span className="sr-only">{index}</span>
              </Link>
            )
          })}
        </div>
        <div className="pointer-events-none absolute top-[42%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-2 rounded-full border border-gold/40 bg-wine-dark/90 px-4 py-1.5 shadow-elevated backdrop-blur-md" data-testid="year-pill">
            <span className="size-1.5 animate-pulse rounded-full bg-gold" />
            <p className="font-serif text-sm font-semibold text-cream tabular-nums">{formatYear(year)}</p>
          </div>
        </div>
        <aside className="absolute top-3 right-3 z-20 w-[min(16rem,calc(100%-1.5rem))]">
          <div className="overflow-hidden rounded-lg border border-gold/40 bg-wine-dark/85 shadow-elevated backdrop-blur-md">
            <button type="button" onClick={() => setHelp((open) => !open)} className="flex w-full items-center gap-2 bg-gradient-to-r from-gold/20 to-transparent px-3 py-2 text-left">
              <Info className="size-3.5 text-gold" />
              <p className="font-serif text-xs font-semibold text-cream">How to navigate</p>
            </button>
            {help ? (
              <div className="space-y-1.5 border-t border-gold/30 px-3 py-2 text-[10px] leading-relaxed text-cream/85">
                <p>Drag sideways, or press Start journey.</p>
                <p>When Narrate is on, each new era opens a page of the story.</p>
                <p>Click a cover to open the book profile.</p>
              </div>
            ) : null}
          </div>
        </aside>
        <button type="button" onClick={() => setStory(current)} className="absolute right-3 bottom-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-wine-dark/85 px-3 py-1.5 text-[11px] text-cream hover:text-gold">
          <BookOpenText className="size-3.5" /> Tell this era
        </button>
      </div>
      {story ? <EraStory era={story} onClose={() => setStory(null)} /> : null}
    </div>
  )
}

function yearToX(year: number): number {
  const era = eraOf(year)
  const index = ERAS.indexOf(era)
  const fraction = (year - era.startYear) / (era.endYear - era.startYear)
  return index * ERA_WIDTH + fraction * ERA_WIDTH
}

function xToYear(x: number): number {
  const index = Math.min(ERAS.length - 1, Math.max(0, Math.floor(x / ERA_WIDTH)))
  const era = ERAS[index]
  const fraction = (x - index * ERA_WIDTH) / ERA_WIDTH
  return Math.round(era.startYear + fraction * (era.endYear - era.startYear))
}

function EraStory({ era, onClose }: { era: Era; onClose: () => void }) {
  const beatDelay = 700
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-wine-dark/90 px-4 backdrop-blur-sm" onClick={onClose} data-testid="era-story">
      <div className="relative max-h-[90%] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gold/40 bg-wine-dark/70 shadow-elevated" onClick={(event) => event.stopPropagation()}>
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${era.color}, hsl(42 70% 55%), ${era.color}, transparent)` }} />
        <button type="button" onClick={onClose} className="absolute top-3 right-3 rounded-full p-1.5 text-cream/60 hover:text-cream" aria-label="Continue the journey">
          <X className="size-4" />
        </button>
        <div className="space-y-6 px-6 py-8 sm:px-10">
          <div className="space-y-1.5 text-center">
            <p className="text-[10px] tracking-[0.3em] text-gold/70 uppercase">Chapter {ERAS.findIndex((item) => item.id === era.id) + 1} of {ERAS.length}</p>
            <h2 className="font-serif text-3xl font-bold text-cream">{era.name}</h2>
            <p className="text-sm text-cream/60">{formatRange(era.startYear, era.endYear)}</p>
            <div className="flex items-center justify-center gap-2 pt-2 opacity-70">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold/60" />
              <Sparkles className="size-3 text-gold/70" />
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold/60" />
            </div>
          </div>
          <div className="space-y-3.5">
            {era.beats.map((beat, index) => (
              <p key={beat.slice(0, 24)} className="font-serif text-sm leading-relaxed text-cream/90 sm:text-base" style={{ animation: `riseIn 0.7s ease-out both`, animationDelay: `${600 + index * beatDelay}ms` }}>
                {beat}
              </p>
            ))}
          </div>
          <div className="border-t border-gold/15 pt-4">
            <div className="flex items-start gap-3">
              <Quote className="mt-1 size-5 shrink-0 text-gold/70" />
              <div>
                <p className="font-serif text-sm text-cream/85 italic sm:text-base">“{era.citation.text}”</p>
                <p className="mt-1.5 text-[11px] text-gold/70">— {era.citation.author}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 text-[11px] text-cream/60 hover:text-gold">
              Continue the journey <ChevronDown className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
