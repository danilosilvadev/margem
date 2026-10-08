import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Info, Maximize2, Minimize2, RotateCcw, TreePine, X, ZoomIn, ZoomOut } from "lucide-react"
import {
  CANON_AUTHORS,
  ERAS,
  allDescendantsOf,
  ancestralChainOf,
  findCanonAuthor,
  formatYear,
  type CanonAuthor,
} from "@shared/literary-canon"
import { worksByAuthor } from "@shared/canon"
import { authorBustDataUri } from "@/lib/author-bust"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { Button } from "@/components/ui/button"

const NODE_RADIUS = 22
const LEAF_SLOT = 86
const MARGIN_X = 60
const MARGIN_Y = 70
const ROW = NODE_RADIUS * 2 + 28
const INITIAL_ZOOM = 0.65

type LayoutNode = { author: CanonAuthor; x: number; y: number }

function buildLayout(authors: CanonAuthor[]): { nodes: Map<string, LayoutNode>; width: number; height: number } {
  const sorted = [...authors].sort((a, b) => a.bornYear - b.bornYear)
  const yearList = sorted.map((author) => author.bornYear)
  const childrenOf = new Map<string | null, CanonAuthor[]>()
  for (const author of authors) {
    const key = author.mainParent ?? null
    const list = childrenOf.get(key) ?? []
    list.push(author)
    childrenOf.set(key, list)
  }
  for (const list of childrenOf.values()) list.sort((a, b) => a.bornYear - b.bornYear)

  const nodes = new Map<string, LayoutNode>()
  const bottomPad = 120
  const height = MARGIN_Y + sorted.length * ROW + bottomPad

  function yFor(year: number): number {
    const row = yearList.indexOf(year)
    return height - bottomPad - row * ROW
  }

  function subtreeWidth(id: string | null): number {
    const children = childrenOf.get(id) ?? []
    if (children.length === 0) return LEAF_SLOT
    return children.reduce((sum, child) => sum + subtreeWidth(child.id), 0)
  }

  function place(id: string | null, left: number): number {
    const children = childrenOf.get(id) ?? []
    if (children.length === 0) return LEAF_SLOT
    let cursor = left
    for (const child of children) {
      const width = subtreeWidth(child.id)
      nodes.set(child.id, { author: child, x: cursor + width / 2, y: yFor(child.bornYear) })
      place(child.id, cursor)
      cursor += width
    }
    return cursor - left
  }

  let cursor = MARGIN_X
  for (const root of authors.filter((author) => !author.mainParent)) {
    const width = subtreeWidth(root.id)
    nodes.set(root.id, { author: root, x: cursor + width / 2, y: yFor(root.bornYear) })
    place(root.id, cursor)
    cursor += width
  }
  return { nodes, width: cursor + MARGIN_X, height }
}

export function TreePage() {
  const layout = useMemo(() => buildLayout(CANON_AUTHORS), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <div data-testid="literary-tree" className="-mb-20 flex h-[calc(100dvh-7rem)] flex-col overflow-hidden bg-gradient-to-br from-wine-dark via-wine to-wine-dark md:-mb-8 md:h-[calc(100dvh-3.5rem)]">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gold/30 bg-gradient-to-b from-wine-dark/80 to-transparent px-4 py-3">
        <LiteraryTabs variant="dark" />
        <div className="ml-auto flex items-center gap-1">
          <Button size="icon" variant="quiet" className="size-8 text-cream hover:bg-cream/10" onClick={() => setZoom((value) => Math.min(2, value + 0.15))} aria-label="Zoom in">
            <ZoomIn className="size-4" />
          </Button>
          <Button size="icon" variant="quiet" className="size-8 text-cream hover:bg-cream/10" onClick={() => setZoom((value) => Math.max(0.4, value - 0.15))} aria-label="Zoom out">
            <ZoomOut className="size-4" />
          </Button>
          <Button size="icon" variant="quiet" className="size-8 text-cream hover:bg-cream/10" onClick={() => { setZoom(INITIAL_ZOOM); setSelectedId(null) }} aria-label="Reset">
            <RotateCcw className="size-4" />
          </Button>
          <Button size="sm" variant="quiet" className="h-8 text-cream hover:bg-cream/10" onClick={() => setFullscreen(true)}>
            <Maximize2 className="size-4" />
            <span className="hidden sm:inline">Full screen</span>
          </Button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <TreeCanvas layout={layout} selectedId={selectedId} setSelectedId={setSelectedId} zoom={zoom} />
        <HowTo />
      </div>
      <AuthorSheet selectedId={selectedId} setSelectedId={setSelectedId} />
      {fullscreen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-wine-dark via-wine to-wine-dark">
          <div className="flex shrink-0 items-center gap-3 border-b border-gold/30 px-4 py-3">
            <TreePine className="size-5 text-gold" />
            <h2 className="font-serif text-base font-bold text-cream sm:text-lg">Family Tree of Literature</h2>
            <p className="hidden text-[11px] text-cream/60 md:block">
              {CANON_AUTHORS.length} authors · {CANON_AUTHORS.reduce((sum, author) => sum + author.influencedBy.length, 0)} influences
            </p>
            <div className="ml-auto flex items-center gap-1">
              <Button size="icon" variant="quiet" className="size-8 text-cream" onClick={() => setZoom((value) => Math.min(2, value + 0.15))} aria-label="Zoom in">
                <ZoomIn className="size-4" />
              </Button>
              <Button size="icon" variant="quiet" className="size-8 text-cream" onClick={() => setZoom((value) => Math.max(0.4, value - 0.15))} aria-label="Zoom out">
                <ZoomOut className="size-4" />
              </Button>
              <Button size="sm" variant="quiet" className="h-8 text-cream" onClick={() => setFullscreen(false)}>
                <Minimize2 className="size-4" /> Exit
              </Button>
              <button type="button" className="rounded-full p-2 text-cream" onClick={() => setFullscreen(false)} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            <TreeCanvas layout={layout} selectedId={selectedId} setSelectedId={setSelectedId} zoom={zoom} fullscreen />
            <HowTo compact />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function HowTo({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches)
  return (
    <aside className="absolute top-3 left-3 z-10 w-[min(18rem,calc(100%-1.5rem))]">
      <div className="overflow-hidden rounded-lg border border-gold/40 bg-wine-dark/85 shadow-elevated backdrop-blur-md">
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-2 bg-gradient-to-r from-gold/20 to-transparent px-3 py-2 text-left">
          <Info className="size-3.5 shrink-0 text-gold" />
          <p className="font-serif text-xs font-semibold text-cream">How to read the tree</p>
        </button>
        {open ? (
          <div className="space-y-1.5 border-t border-gold/30 px-3 py-2.5 text-[11px] leading-relaxed text-cream/85">
            <p>Time flows from the bottom up. Homer is at the bottom, the latest authors at the top.</p>
            <p>Each branch links an author to their main master. Dashed gold marks a secondary influence.</p>
            {compact ? <p>Click a medallion to see masters, heirs, and books.</p> : <p>A dashed medallion means the author is not on this shelf.</p>}
          </div>
        ) : null}
      </div>
    </aside>
  )
}

function TreeCanvas({
  layout,
  selectedId,
  setSelectedId,
  zoom,
  fullscreen = false,
}: {
  layout: { nodes: Map<string, LayoutNode>; width: number; height: number }
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  zoom: number
  fullscreen?: boolean
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const frame = () => {
      const homer = layout.nodes.get("homer")
      const scale = zoomRef.current
      const anchor = homer ? homer.x * scale - el.clientWidth / 2 : (el.scrollWidth - el.clientWidth) / 2
      el.scrollLeft = Math.max(0, anchor)
      el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight)
    }
    frame()
    const id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [layout, fullscreen])

  const ancestors = useMemo(() => (selectedId ? new Set(ancestralChainOf(selectedId).map((author) => author.id)) : new Set<string>()), [selectedId])
  const descendants = useMemo(() => (selectedId ? allDescendantsOf(selectedId) : new Set<string>()), [selectedId])
  const eraColor = (id: string) => ERAS.find((era) => era.id === id)?.color ?? "#666"

  return (
    <div
      ref={scroller}
      data-testid="tree-canvas"
      className="h-full w-full cursor-grab overflow-auto bg-gradient-to-br from-wine-dark via-wine to-wine-dark active:cursor-grabbing"
      onPointerDown={(event) => {
        if (event.button !== 0 || !scroller.current) return
        drag.current = { x: event.clientX, y: event.clientY, left: scroller.current.scrollLeft, top: scroller.current.scrollTop, moved: false }
      }}
      onPointerMove={(event) => {
        if (!drag.current || !scroller.current) return
        const dx = event.clientX - drag.current.x
        const dy = event.clientY - drag.current.y
        if (!drag.current.moved && Math.hypot(dx, dy) < 6) return
        drag.current.moved = true
        scroller.current.scrollLeft = drag.current.left - dx
        scroller.current.scrollTop = drag.current.top - dy
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
      <svg width={layout.width * zoom} height={layout.height * zoom} viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label="Family tree of literature">
        <defs>
          <pattern id="wine-bg" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="hsl(350 50% 16%)" />
            <circle cx="10" cy="10" r="0.6" fill="hsl(42 70% 55%)" opacity="0.12" />
            <circle cx="30" cy="20" r="0.6" fill="hsl(42 70% 55%)" opacity="0.12" />
          </pattern>
          <radialGradient id="medal-bg" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="hsl(30 25% 97%)" />
            <stop offset="1" stopColor="hsl(42 70% 55%)" />
          </radialGradient>
          <clipPath id="medal-clip">
            <circle r={NODE_RADIUS - 3} />
          </clipPath>
        </defs>
        <rect width={layout.width} height={layout.height} fill="url(#wine-bg)" />
        {ERAS.map((era) => {
          const group = CANON_AUTHORS.filter((author) => author.era === era.id)
          if (!group.length) return null
          const ys = group.map((author) => layout.nodes.get(author.id)?.y).filter((value): value is number => value != null)
          if (!ys.length) return null
          const top = Math.min(...ys) - NODE_RADIUS - 18
          const bottom = Math.max(...ys) + NODE_RADIUS + 36
          return (
            <g key={era.id}>
              <rect x={0} y={top} width={layout.width} height={bottom - top} fill={era.color} opacity={0.06} />
              <text x={20} y={top + 16} fill="hsl(42 70% 55%)" fontFamily="Georgia, serif" fontSize={14} opacity={0.55} letterSpacing={2}>
                {era.name.toUpperCase()}
              </text>
            </g>
          )
        })}
        {[...layout.nodes.values()].map((node) => {
          if (!node.author.mainParent) return null
          const parent = layout.nodes.get(node.author.mainParent)
          if (!parent) return null
          const onPath = selectedId && (ancestors.has(node.author.id) || ancestors.has(parent.author.id) || node.author.id === selectedId || parent.author.id === selectedId || descendants.has(node.author.id))
          const midY = (node.y + parent.y) / 2
          return (
            <path
              key={`branch-${node.author.id}`}
              d={`M ${parent.x} ${parent.y} C ${parent.x} ${midY}, ${node.x} ${midY}, ${node.x} ${node.y}`}
              stroke={onPath ? "hsl(42 70% 55%)" : "hsl(30 25% 97% / 0.45)"}
              strokeWidth={onPath ? 3.5 : 1.4}
              fill="none"
              opacity={selectedId && !onPath ? 0.12 : onPath ? 0.95 : 0.5}
            />
          )
        })}
        {[...layout.nodes.values()].map((node) =>
          node.author.influencedBy
            .filter((id) => id !== node.author.mainParent)
            .map((id) => {
              const parent = layout.nodes.get(id)
              if (!parent) return null
              const active = !selectedId || selectedId === node.author.id
              return (
                <path
                  key={`cross-${node.author.id}-${id}`}
                  d={`M ${parent.x} ${parent.y} Q ${(parent.x + node.x) / 2 + 30} ${(parent.y + node.y) / 2}, ${node.x} ${node.y}`}
                  stroke="hsl(42 70% 55%)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  fill="none"
                  opacity={active ? 0.75 : 0.15}
                />
              )
            }),
        )}
        {[...layout.nodes.values()].map((node) => {
          const author = node.author
          const isSelected = selectedId === author.id
          const highlighted = isSelected || ancestors.has(author.id) || descendants.has(author.id)
          const dimmed = !!selectedId && !highlighted
          const ring = isSelected ? "hsl(42 70% 55%)" : ancestors.has(author.id) ? "hsl(350 40% 45%)" : descendants.has(author.id) ? "hsl(42 65% 70%)" : author.ghost ? "hsl(30 25% 97% / 0.35)" : eraColor(author.era)
          return (
            <g
              key={author.id}
              transform={`translate(${node.x} ${node.y})`}
              opacity={dimmed ? 0.25 : 1}
              className="cursor-pointer"
              onClick={() => setSelectedId(isSelected ? null : author.id)}
              onMouseEnter={() => setHoverId(author.id)}
              onMouseLeave={() => setHoverId(null)}
            >
              <title>{`${author.name}. ${author.summary}`}</title>
              <circle r={NODE_RADIUS + 4} fill={ring} opacity={0.5} />
              <circle r={NODE_RADIUS} fill="url(#medal-bg)" stroke={ring} strokeWidth={isSelected ? 3 : highlighted ? 2 : 1.5} strokeDasharray={author.ghost ? "3 2" : undefined} />
              <image href={authorBustDataUri(author.name)} x={-(NODE_RADIUS - 3)} y={-(NODE_RADIUS - 3)} width={(NODE_RADIUS - 3) * 2} height={(NODE_RADIUS - 3) * 2} clipPath="url(#medal-clip)" preserveAspectRatio="xMidYMid slice" />
              {author.ghost ? <circle r={NODE_RADIUS + 6} fill="none" stroke="hsl(30 25% 97% / 0.55)" strokeWidth={0.8} strokeDasharray="3 2" /> : null}
              <text y={NODE_RADIUS + 16} textAnchor="middle" fill={highlighted || hoverId === author.id ? "hsl(30 25% 97%)" : "hsl(30 25% 97% / 0.85)"} fontFamily="Georgia, serif" fontSize={isSelected ? 12 : 10} fontWeight={highlighted ? 700 : 500}>
                {author.name}
              </text>
              <text y={NODE_RADIUS + 28} textAnchor="middle" fill="hsl(42 70% 55% / 0.8)" fontSize={8} fontFamily="sans-serif">
                {formatYear(author.bornYear)}
                {author.diedYear != null ? ` – ${formatYear(author.diedYear)}` : ""}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function AuthorSheet({ selectedId, setSelectedId }: { selectedId: string | null; setSelectedId: (id: string | null) => void }) {
  const selected = selectedId ? findCanonAuthor(selectedId) : undefined
  const heirs = useMemo(() => (selectedId ? [...allDescendantsOf(selectedId)] : []), [selectedId])
  if (!selected) return null
  const era = ERAS.find((item) => item.id === selected.era)
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 max-h-[75%] overflow-y-auto rounded-t-2xl border-t border-line bg-paper p-4 shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[26rem] md:rounded-none md:border-l" data-testid="author-sheet">
      <button type="button" onClick={() => setSelectedId(null)} className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="size-3" /> Close
      </button>
      <h3 className="font-serif text-2xl">{selected.name}</h3>
      <div className="mt-4 flex items-start gap-3">
        <img src={authorBustDataUri(selected.name)} alt="" className="h-24 w-20 rounded-lg bg-wine-dark object-cover ring-1 ring-border" />
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs text-muted-foreground">
            {formatYear(selected.bornYear)}
            {selected.diedYear != null ? ` – ${formatYear(selected.diedYear)}` : ""}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">{selected.nationality}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">{era?.name}</span>
            {selected.ghost ? <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px]">Not on this shelf</span> : null}
          </div>
          <p className="pt-1 text-sm leading-relaxed">{selected.summary}</p>
        </div>
      </div>
      <section className="mt-4">
        <p className="mb-2 text-xs tracking-wider text-muted-foreground uppercase">Influenced by ({selected.influencedBy.length})</p>
        {selected.influencedBy.length === 0 ? <p className="text-xs text-muted-foreground italic">A root. No earlier literary master is mapped.</p> : null}
        <div className="space-y-1.5">
          {selected.influencedBy.map((id) => {
            const parent = findCanonAuthor(id)
            if (!parent) return null
            return (
              <button key={id} type="button" onClick={() => setSelectedId(id)} className="flex w-full items-center gap-2 rounded p-1.5 text-left hover:bg-secondary">
                <img src={authorBustDataUri(parent.name)} alt="" className="size-7 rounded-full bg-wine-dark object-cover ring-1 ring-border" />
                <span>
                  <span className="block text-xs font-medium">{parent.name}</span>
                  <span className="block text-[10px] text-muted-foreground">{formatYear(parent.bornYear)}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>
      <section className="mt-4">
        <p className="mb-2 text-xs tracking-wider text-muted-foreground uppercase">Influenced ({heirs.length} heirs)</p>
        {heirs.length === 0 ? <p className="text-xs text-muted-foreground italic">A leaf. No later heirs are mapped.</p> : null}
        <div className="space-y-1.5">
          {heirs.slice(0, 15).map((id) => {
            const heir = findCanonAuthor(id)
            if (!heir) return null
            return (
              <button key={id} type="button" onClick={() => setSelectedId(id)} className="flex w-full items-center gap-2 rounded p-1.5 text-left hover:bg-secondary">
                <img src={authorBustDataUri(heir.name)} alt="" className="size-7 rounded-full bg-wine-dark object-cover ring-1 ring-border" />
                <span className="text-xs font-medium">{heir.name}</span>
              </button>
            )
          })}
        </div>
      </section>
      {selected.workIds.length > 0 ? (
        <section className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs tracking-wider text-muted-foreground uppercase">Works on this shelf</p>
          <div className="flex flex-col gap-1.5">
            {worksByAuthor(selected.id).map((work) => (
              <Link key={work.id} to={`/book/${work.id}`} className="rounded bg-primary/10 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/20">
                {work.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
