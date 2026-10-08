import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { AUTHORS, INFLUENCES, authorById, worksByAuthor, type Author } from "@shared/canon"
import { checkInfluence, recordAnswer, treeQuestions } from "@shared/games"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { loadGameProgress, saveGameProgress } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

const BORN: Record<string, number> = {
  homer: -750,
  aeschylus: -525,
  sophocles: -496,
  virgil: -70,
  seneca: -4,
  dante: 1265,
  petrarch: 1304,
  boccaccio: 1313,
  cervantes: 1547,
  shakespeare: 1564,
  milton: 1608,
  rousseau: 1712,
  goethe: 1749,
  austen: 1775,
  shelley: 1797,
  gogol: 1809,
  poe: 1809,
  dickens: 1812,
  dostoevsky: 1821,
  baudelaire: 1821,
  tolstoy: 1828,
  machado: 1839,
  "perez-bonalde": 1846,
  kafka: 1883,
}

const COL_W = 210
const PAD_X = 96
const PAD_Y = 56

function columnsFor(px: number): number {
  if (px < 560) return 2
  if (px < 980) return 3
  return 4
}

function monogram(name: string): string {
  const skip = new Set(["de", "von", "of", "the"])
  const parts = name.split(" ").filter((part) => part && !skip.has(part.toLowerCase()))
  if (parts.length <= 1) return (parts[0] ?? name).slice(0, 2)
  return `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`
}

function nameLines(name: string): string[] {
  if (name.length <= 14) return [name]
  const words = name.split(" ")
  if (words.length === 1) return [name]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")]
}

export function TreePage() {
  const questions = useMemo(() => treeQuestions(), [])
  const [cursor, setCursor] = useState(0)
  const [progress, setProgress] = useState(() => loadGameProgress())
  const [revealed, setRevealed] = useState<{ right: boolean; text: string } | null>(null)
  const [zoom, setZoom] = useState(1)
  const boardRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  const [cols, setCols] = useState(4)
  const question = questions[cursor % Math.max(questions.length, 1)]
  const askedId = question?.subjectId ?? null
  const people = useMemo(
    () => [...AUTHORS].sort((a, b) => (BORN[a.id] ?? 3000) - (BORN[b.id] ?? 3000) || a.name.localeCompare(b.name)),
    [],
  )
  const nameSize = 13 / Math.max(fit, 0.45)
  const rowH = 48 + nameSize * 3.1
  const positions = useMemo(() => {
    const map = new Map<string, { author: Author; x: number; y: number }>()
    people.forEach((author, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      map.set(author.id, { author, x: PAD_X + col * COL_W + COL_W / 2, y: PAD_Y + row * rowH + 28 })
    })
    return map
  }, [people, cols, rowH])
  const rows = Math.ceil(people.length / cols)
  const width = PAD_X * 2 + cols * COL_W
  const height = PAD_Y * 2 + rows * rowH
  const asked = askedId ? authorById(askedId) : undefined
  const questionEdge = INFLUENCES.find((edge) => `${edge.from}-${edge.to}` === question?.id)
  const lit = revealed && questionEdge ? new Set([questionEdge.from, questionEdge.to]) : new Set<string>()

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const apply = () => {
      const nextCols = columnsFor(el.clientWidth)
      const boardW = PAD_X * 2 + nextCols * COL_W
      setCols(nextCols)
      setFit(el.clientWidth / boardW)
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function answer(guess: string) {
    if (!question || revealed) return
    const right = checkInfluence(question.id, guess)
    const next = { ...progress, tree: recordAnswer(progress.tree, right) }
    setProgress(next)
    saveGameProgress(next)
    const edge = INFLUENCES.find((item) => `${item.from}-${item.to}` === question.id)
    setRevealed({
      right,
      text: right ? `Yes. ${edge?.note ?? ""}` : `Not quite. ${edge?.note ?? ""}`,
    })
  }

  return (
    <main data-testid="tree" className="mx-auto max-w-6xl px-4 py-6">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">Family tree</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {INFLUENCES.length} documented links. The gold line appears after you answer. Score {progress.tree.correct} correct, on this device.
      </p>

      {question ? (
        <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
              Link {(cursor % questions.length) + 1} of {questions.length}
            </p>
            <p className="text-sm">
              Score <span className="font-semibold text-primary">{progress.tree.correct}</span> correct
            </p>
          </div>
          <h2 className="mt-2 font-serif text-2xl">{question.prompt}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[...question.choices].sort((a, b) => a.localeCompare(b)).map((choice) => (
              <Button key={choice} variant="line" className="h-auto justify-start whitespace-normal py-3 text-left" disabled={Boolean(revealed)} onClick={() => answer(choice)}>
                {choice}
              </Button>
            ))}
          </div>
          {revealed ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm">{revealed.text}</p>
              <Button
                onClick={() => {
                  setRevealed(null)
                  setCursor((value) => value + 1)
                }}
              >
                Next link
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_18rem]">
        <div ref={boardRef} className="overflow-hidden rounded-2xl border border-primary/20 bg-wine-dark shadow-elevated">
          <div className="sticky top-0 z-10 flex gap-2 border-b border-cream/10 bg-wine-dark/90 px-3 py-2">
            <Button size="sm" variant="gold" onClick={() => setZoom((value) => Math.min(1.6, value + 0.15))}>
              Zoom in
            </Button>
            <Button size="sm" variant="line" onClick={() => setZoom((value) => Math.max(0.6, value - 0.15))}>
              Zoom out
            </Button>
            <Button size="sm" variant="line" onClick={() => setZoom(1)}>
              Reset
            </Button>
          </div>
          <svg width={width * fit * zoom} height={height * fit * zoom} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Literary family tree">
            <rect width={width} height={height} fill="hsl(350 48% 16%)" />
            {INFLUENCES.map((edge) => {
              const from = positions.get(edge.from)
              const to = positions.get(edge.to)
              if (!from || !to) return null
              const hot = revealed != null && questionEdge?.from === edge.from && questionEdge.to === edge.to
              const midY = (from.y + to.y) / 2
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  d={`M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`}
                  fill="none"
                  stroke={hot ? "hsl(42 78% 62%)" : "hsl(40 35% 70%)"}
                  strokeWidth={hot ? 4 : 1.8}
                  opacity={revealed && !hot ? 0.45 : 0.95}
                />
              )
            })}
            {[...positions.values()].map(({ author, x, y }) => {
              const on = author.id === askedId
              const dim = revealed != null && !lit.has(author.id)
              const lines = nameLines(author.name)
              return (
                <g key={author.id} opacity={dim ? 0.82 : 1}>
                  <title>{`${author.name}. ${author.life}`}</title>
                  <circle cx={x} cy={y} r={on ? 16 : 13} fill={on ? "hsl(42 70% 55%)" : "hsl(30 28% 92%)"} stroke="hsl(42 55% 48%)" strokeWidth={on ? 3 : 1.2} />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontFamily="Georgia, serif" fill="hsl(350 45% 22%)">
                    {monogram(author.name)}
                  </text>
                  {lines.map((line, index) => (
                    <text key={line} x={x} y={y + nameSize * 1.8 + index * nameSize * 1.25} textAnchor="middle" fontSize={nameSize} fill="hsl(36 55% 96%)" fontFamily="Georgia, serif">
                      {line}
                    </text>
                  ))}
                </g>
              )
            })}
          </svg>
        </div>
        <aside className="rounded-2xl border border-border bg-card p-4">
          {asked ? (
            <>
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">This question</p>
              <h2 className="mt-1 font-serif text-2xl">{asked.name}</h2>
              <p className="text-xs text-muted-foreground">{asked.life}</p>
              <p className="mt-2 text-sm text-muted-foreground">{asked.bio}</p>
              {revealed && questionEdge ? (
                <div className="mt-4 text-sm">
                  <p className="font-serif">
                    {authorById(questionEdge.from)?.name} → {authorById(questionEdge.to)?.name}
                  </p>
                  <p className="mt-1 text-muted-foreground">{questionEdge.note}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">The link stays hidden until you answer.</p>
              )}
              {worksByAuthor(asked.id)[0] ? (
                <Link to={`/book/${worksByAuthor(asked.id)[0]?.textId ?? worksByAuthor(asked.id)[0]?.id}`} className="mt-4 inline-block text-sm text-primary">
                  Open a work
                </Link>
              ) : null}
            </>
          ) : null}
        </aside>
      </div>
    </main>
  )
}
