import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AUTHORS, authorById, worksByAuthor, type Author } from "@shared/canon"
import { checkCountry, mapChoices, mapQuestions, recordAnswer } from "@shared/games"
import { WORLD_LAND_D } from "@/assets/world-land"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { loadGameProgress, saveGameProgress } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

const W = 1000
const H = 500

function project(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * W, ((90 - lat) / 180) * H]
}

const EUROPE = { x: 450, y: 68, w: 200, h: 100 }

type Box = { x: number; y: number; w: number; h: number }

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function clusterPins(pins: Author[], threshold: number): Author[][] {
  const used = new Set<string>()
  const groups: Author[][] = []
  for (const pin of pins) {
    if (used.has(pin.id)) continue
    const group = [pin]
    used.add(pin.id)
    let grew = true
    while (grew) {
      grew = false
      for (const other of pins) {
        if (used.has(other.id)) continue
        const near = group.some((member) => {
          const [x1, y1] = project(member.lon, member.lat)
          const [x2, y2] = project(other.lon, other.lat)
          return Math.hypot(x1 - x2, y1 - y2) < threshold
        })
        if (near) {
          group.push(other)
          used.add(other.id)
          grew = true
        }
      }
    }
    groups.push(group)
  }
  return groups
}

export function MapPage() {
  const questions = useMemo(() => mapQuestions(), [])
  const pins = useMemo(() => AUTHORS.filter((author) => author.onMap !== false), [])
  const [cursor, setCursor] = useState(0)
  const [progress, setProgress] = useState(() => loadGameProgress())
  const [revealed, setRevealed] = useState<{ right: boolean; text: string } | null>(null)
  const [view, setView] = useState<"world" | "europe">("world")
  const [activeId, setActiveId] = useState<string | null>(null)
  const question = questions[cursor % Math.max(questions.length, 1)]
  const choices = question ? [...mapChoices(question.answer)].sort((a, b) => a.localeCompare(b)) : []
  const active = pins.find((author) => author.id === activeId) ?? null
  const groups = clusterPins(pins, view === "world" ? 12 : 0)
  const frame = view === "europe" ? EUROPE : { x: 0, y: 0, w: W, h: H }
  const labelSize = view === "europe" ? 4.2 : 16

  const labels = useMemo(() => {
    const placed: Box[] = []
    const drawn: { id: string; text: string; x: number; y: number }[] = []
    const singles = groups.filter((group) => group.length === 1).map((group) => group[0])
    for (const author of singles) {
      if (!author) continue
      const [px, py] = project(author.lon, author.lat)
      const text = author.name
      const boxW = text.length * labelSize * 0.52
      const boxH = labelSize * 1.25
      const candidates = [
        { x: px + labelSize * 0.7, y: py - boxH / 2 },
        { x: px - boxW - labelSize * 0.7, y: py - boxH / 2 },
        { x: px - boxW / 2, y: py - boxH - labelSize * 0.45 },
        { x: px - boxW / 2, y: py + labelSize * 0.55 },
      ]
      const fits = (candidate: { x: number; y: number }) =>
        candidate.x > frame.x &&
        candidate.y > frame.y &&
        candidate.x + boxW < frame.x + frame.w &&
        candidate.y + boxH < frame.y + frame.h &&
        !placed.some((box) => overlaps({ ...candidate, w: boxW, h: boxH }, box))
      let spot = candidates.find((candidate) => fits(candidate))
      if (!spot) {
        for (let step = 1; step <= 8 && !spot; step += 1) {
          const dy = step * (boxH + labelSize * 0.35)
          const farther = [
            { x: px + labelSize, y: py - boxH / 2 - dy },
            { x: px + labelSize, y: py - boxH / 2 + dy },
            { x: px - boxW - labelSize, y: py - boxH / 2 - dy },
            { x: px - boxW - labelSize, y: py - boxH / 2 + dy },
          ]
          spot = farther.find((candidate) => fits(candidate))
        }
      }
      if (!spot) continue
      placed.push({ ...spot, w: boxW, h: boxH })
      drawn.push({ id: author.id, text, x: spot.x, y: spot.y + boxH * 0.8 })
    }
    return drawn
  }, [groups, frame.x, frame.y, frame.w, frame.h, labelSize])

  function answer(guess: string) {
    if (!question || revealed) return
    const right = checkCountry(question.authorId, guess)
    const next = { ...progress, map: recordAnswer(progress.map, right) }
    setProgress(next)
    saveGameProgress(next)
    const name = authorById(question.authorId)?.name ?? "They"
    setRevealed({
      right,
      text: right ? `Yes. ${name} was born in ${question.answer}.` : `No. ${name} was born in ${question.answer}.`,
    })
  }

  function nextQuestion() {
    setRevealed(null)
    setCursor((value) => value + 1)
  }

  return (
    <main data-testid="map" className="mx-auto max-w-6xl px-4 py-6">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">Literary map</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Natural Earth coastlines. Pins are birthplaces, except Homer, whose pin is the Ionian coast of the tradition. Names that would collide stay in the list and the tooltip.
      </p>

      {question ? (
        <section data-testid="map-quiz" className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
              Question {(cursor % questions.length) + 1} of {questions.length}
            </p>
            <p className="text-sm">
              Score <span className="font-semibold text-primary">{progress.map.correct}</span> correct · {progress.map.answered} answered
            </p>
          </div>
          <h2 className="mt-2 font-serif text-2xl">{question.prompt}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {choices.map((choice) => (
              <Button key={choice} variant="line" disabled={Boolean(revealed)} onClick={() => answer(choice)}>
                {choice}
              </Button>
            ))}
          </div>
          {revealed ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className={`text-sm ${revealed.right ? "text-primary" : "text-foreground"}`}>{revealed.text}</p>
              <Button onClick={nextQuestion}>Next question</Button>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Places">
        {pins.map((author) => (
          <button
            key={author.id}
            type="button"
            className={`shrink-0 rounded-full border px-3 py-1.5 text-left text-xs ${activeId === author.id ? "border-primary bg-secondary text-primary" : "border-border bg-card"}`}
            onClick={() => {
              setActiveId(author.id)
              if (author.lon > -15 && author.lon < 50 && author.lat > 34 && author.lat < 64) setView("europe")
            }}
          >
            {author.name}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_17rem]">
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-wine-dark shadow-elevated">
          <div className="flex flex-wrap items-center gap-2 border-b border-cream/10 px-3 py-2">
            <Button size="sm" variant={view === "world" ? "gold" : "line"} onClick={() => setView("world")}>
              World
            </Button>
            <Button size="sm" variant={view === "europe" ? "gold" : "line"} onClick={() => setView("europe")}>
              Europe
            </Button>
            <p className="text-xs text-cream/70">Tap a pin. Clusters open the closer view.</p>
          </div>
          <svg
            viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
            className="h-52 w-full touch-pan-x sm:h-96"
            role="img"
            aria-label="World map of birthplaces"
          >
            <rect x={0} y={0} width={W} height={H} fill="hsl(350 50% 16%)" />
            <path d={WORLD_LAND_D} fill="hsl(40 42% 78%)" stroke="hsl(42 40% 42%)" strokeWidth={view === "europe" ? 0.35 : 0.7} />
            {groups.map((group) => {
              const [x, y] = group.reduce(
                (sum, author) => {
                  const [px, py] = project(author.lon, author.lat)
                  return [sum[0] + px, sum[1] + py]
                },
                [0, 0],
              )
              const cx = x / group.length
              const cy = y / group.length
              if (group.length > 1) {
                const names = group.map((author) => author.name).join(", ")
                return (
                  <g
                    key={group.map((author) => author.id).join("-")}
                    className="cursor-pointer"
                    onClick={() => {
                      setView("europe")
                      setActiveId(group[0]?.id ?? null)
                    }}
                  >
                    <title>{names}. Open Europe.</title>
                    <circle cx={cx} cy={cy} r={view === "europe" ? 3 : 11} fill="hsl(42 70% 55%)" stroke="hsl(30 25% 97%)" strokeWidth={view === "europe" ? 0.4 : 1.5} />
                    <text x={cx} y={cy + (view === "europe" ? 1 : 4)} textAnchor="middle" fill="hsl(350 50% 16%)" fontSize={view === "europe" ? 3 : 11} fontWeight="700">
                      {group.length}
                    </text>
                  </g>
                )
              }
              const author = group[0]
              if (!author) return null
              const [px, py] = project(author.lon, author.lat)
              const on = activeId === author.id
              return (
                <g key={author.id} className="cursor-pointer" onClick={() => setActiveId(author.id)}>
                  <title>{`${author.name}. ${author.placeNote}`}</title>
                  <circle cx={px} cy={py} r={on ? (view === "europe" ? 2.4 : 8) : view === "europe" ? 1.8 : 6} fill="hsl(42 70% 55%)" stroke="hsl(30 25% 97%)" strokeWidth={view === "europe" ? 0.35 : 1.4} />
                </g>
              )
            })}
            {labels.map((label) => (
              <text key={label.id} x={label.x} y={label.y} fill="hsl(30 25% 96%)" fontSize={labelSize} fontFamily="Georgia, serif">
                {label.text}
              </text>
            ))}
          </svg>
        </div>
        <aside className="rounded-2xl border border-border bg-card p-3">
          <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Places</p>
          {active ? (
            <div className="mt-2 rounded-lg bg-secondary px-3 py-2">
              <p className="font-serif">{active.name}</p>
              <p className="text-xs text-muted-foreground">{active.placeNote}</p>
              <Link to={`/book/${worksByAuthor(active.id)[0]?.textId ?? worksByAuthor(active.id)[0]?.id ?? "the-raven"}`} className="mt-1 inline-block text-xs text-primary">
                Open a work
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Tap a name. The gold count on the map is several writers too close to label at once.</p>
          )}
          <ul className="mt-3 max-h-80 space-y-1 overflow-auto">
            {pins.map((author) => (
              <li key={author.id}>
                <button
                  type="button"
                  className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${activeId === author.id ? "bg-secondary text-primary" : "hover:bg-secondary"}`}
                  onClick={() => {
                    setActiveId(author.id)
                    if (author.lon > -15 && author.lon < 50 && author.lat > 34 && author.lat < 64) setView("europe")
                  }}
                >
                  <span className="font-serif">{author.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{author.country ?? "No documented birthplace"}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  )
}
