import { useMemo, useState } from "react"
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

const COLS = 6
const COL_W = 150
const ROW_H = 118
const PAD_X = 36
const PAD_Y = 36

function monogram(name: string): string {
  const skip = new Set(["de", "von", "of", "the"])
  const parts = name.split(" ").filter((part) => part && !skip.has(part.toLowerCase()))
  if (parts.length <= 1) return (parts[0] ?? name).slice(0, 2)
  return `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`
}

function nameLines(name: string): string[] {
  if (name.length <= 18) return [name]
  const words = name.split(" ")
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")]
}

function walk(start: string, backward: boolean): Set<string> {
  const seen = new Set<string>([start])
  const queue = [start]
  while (queue.length) {
    const current = queue.pop()
    if (!current) continue
    for (const edge of INFLUENCES) {
      const next = backward ? (edge.to === current ? edge.from : null) : edge.from === current ? edge.to : null
      if (next && !seen.has(next)) {
        seen.add(next)
        queue.push(next)
      }
    }
  }
  return seen
}

export function TreePage() {
  const questions = useMemo(() => treeQuestions(), [])
  const [cursor, setCursor] = useState(0)
  const [progress, setProgress] = useState(() => loadGameProgress())
  const [revealed, setRevealed] = useState<{ right: boolean; text: string } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>("dante")
  const [zoom, setZoom] = useState(1)
  const question = questions[cursor % Math.max(questions.length, 1)]
  const people = useMemo(
    () => [...AUTHORS].sort((a, b) => (BORN[a.id] ?? 3000) - (BORN[b.id] ?? 3000) || a.name.localeCompare(b.name)),
    [],
  )
  const positions = useMemo(() => {
    const map = new Map<string, { author: Author; x: number; y: number }>()
    people.forEach((author, index) => {
      const col = index % COLS
      const row = Math.floor(index / COLS)
      map.set(author.id, { author, x: PAD_X + col * COL_W + COL_W / 2, y: PAD_Y + row * ROW_H + 28 })
    })
    return map
  }, [people])
  const rows = Math.ceil(people.length / COLS)
  const width = PAD_X * 2 + COLS * COL_W
  const height = PAD_Y * 2 + rows * ROW_H
  const ancestors = selectedId ? walk(selectedId, true) : new Set<string>()
  const descendants = selectedId ? walk(selectedId, false) : new Set<string>()
  const lit = new Set([...ancestors, ...descendants])
  const selected = selectedId ? authorById(selectedId) : undefined
  const related = INFLUENCES.filter((edge) => edge.from === selectedId || edge.to === selectedId)

  function answer(guess: string) {
    if (!question || revealed) return
    const right = checkInfluence(question.id, guess)
    const next = { ...progress, tree: recordAnswer(progress.tree, right) }
    setProgress(next)
    saveGameProgress(next)
    const edge = INFLUENCES.find((item) => `${item.from}-${item.to}` === question.id)
    setRevealed({ right, text: edge?.note ?? (right ? "Yes." : "No.") })
    if (edge) setSelectedId(edge.to)
  }

  return (
    <main data-testid="tree" className="mx-auto max-w-6xl px-4 py-6">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">Family tree</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {INFLUENCES.length} documented links. Click a name to light the line behind it and the line ahead of it. Score {progress.tree.correct} correct · {progress.tree.answered} answered, on this device.
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
              <p className="text-sm">{revealed.right ? "Yes. " : "No. "}{revealed.text}</p>
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
        <div className="overflow-auto rounded-2xl border border-primary/20 bg-wine-dark shadow-elevated">
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
          <svg width={width * zoom} height={height * zoom} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Literary family tree">
            <rect width={width} height={height} fill="hsl(350 48% 16%)" />
            {INFLUENCES.map((edge) => {
              const from = positions.get(edge.from)
              const to = positions.get(edge.to)
              if (!from || !to) return null
              const hot = selectedId != null && lit.has(edge.from) && lit.has(edge.to) && (edge.from === selectedId || edge.to === selectedId || (ancestors.has(edge.from) && ancestors.has(edge.to)) || (descendants.has(edge.from) && descendants.has(edge.to)))
              const midY = (from.y + to.y) / 2
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  d={`M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`}
                  fill="none"
                  stroke={hot ? "hsl(42 70% 58%)" : "hsl(42 30% 45%)"}
                  strokeWidth={hot ? 2.4 : 1}
                  opacity={selectedId && !hot ? 0.25 : 0.9}
                />
              )
            })}
            {[...positions.values()].map(({ author, x, y }) => {
              const on = author.id === selectedId
              const dim = selectedId != null && !lit.has(author.id)
              const lines = nameLines(author.name)
              return (
                <g key={author.id} className="cursor-pointer" opacity={dim ? 0.35 : 1} onClick={() => setSelectedId(author.id)}>
                  <title>{`${author.name}. ${author.life}`}</title>
                  <circle cx={x} cy={y} r={on ? 16 : 13} fill={on ? "hsl(42 70% 55%)" : "hsl(30 28% 92%)"} stroke="hsl(42 55% 48%)" strokeWidth={on ? 3 : 1.2} />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontFamily="Georgia, serif" fill="hsl(350 45% 22%)">
                    {monogram(author.name)}
                  </text>
                  {lines.map((line, index) => (
                    <text key={line} x={x} y={y + 28 + index * 13} textAnchor="middle" fontSize="11" fill="hsl(30 25% 96%)" fontFamily="Georgia, serif">
                      {line}
                    </text>
                  ))}
                </g>
              )
            })}
          </svg>
        </div>
        <aside className="rounded-2xl border border-border bg-card p-4">
          {selected ? (
            <>
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{selected.life}</p>
              <h2 className="mt-1 font-serif text-2xl">{selected.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{selected.bio}</p>
              <ul className="mt-4 space-y-3">
                {related.map((edge) => (
                  <li key={`${edge.from}-${edge.to}`} className="text-sm">
                    <p className="font-serif">
                      {authorById(edge.from)?.name} → {authorById(edge.to)?.name}
                    </p>
                    <p className="text-muted-foreground">{edge.note}</p>
                  </li>
                ))}
              </ul>
              {worksByAuthor(selected.id)[0] ? (
                <Link to={`/book/${worksByAuthor(selected.id)[0]?.textId ?? worksByAuthor(selected.id)[0]?.id}`} className="mt-4 inline-block text-sm text-primary">
                  Open a work
                </Link>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">No separate work page. The link above is the reason this name is on the tree.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Choose a name on the tree.</p>
          )}
        </aside>
      </div>
    </main>
  )
}
