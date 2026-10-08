import { useRef, useState, type PointerEvent, type WheelEvent } from "react"
import { Link } from "react-router-dom"
import { AUTHORS, authorById, worksByAuthor, type Author } from "@shared/canon"
import { checkCountry, mapQuestions, recordAnswer } from "@shared/games"
import { WORLD_LAND_D } from "@/assets/world-land"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { loadGameProgress, saveGameProgress } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

const W = 1000
const H = 500

type Frame = { x: number; y: number; w: number; h: number }

const WORLD: Frame = { x: 0, y: 0, w: W, h: H }
const EUROPE: Frame = { x: 458, y: 70, w: 190, h: 95 }

function project(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * W, ((90 - lat) / 180) * H]
}

function clampFrame(frame: Frame): Frame {
  const w = Math.min(W, Math.max(28, frame.w))
  const h = Math.min(H, Math.max(14, frame.h))
  return {
    x: Math.max(0, Math.min(W - w, frame.x)),
    y: Math.max(0, Math.min(H - h, frame.y)),
    w,
    h,
  }
}

function zoomFrame(frame: Frame, factor: number): Frame {
  const w = frame.w * factor
  const h = frame.h * factor
  const cx = frame.x + frame.w / 2
  const cy = frame.y + frame.h / 2
  return clampFrame({ x: cx - w / 2, y: cy - h / 2, w, h })
}

function frameAround(lon: number, lat: number): Frame {
  const [x, y] = project(lon, lat)
  const w = 80
  const h = 40
  return clampFrame({ x: x - w / 2, y: y - h / 2, w, h })
}

type Label = { id: string; text: string; x: number; y: number; anchor: "start" | "end"; pinX: number; pinY: number }

function labelsFor(pins: Author[], frame: Frame): Label[] {
  const size = frame.w * 0.028
  const placed: { x: number; y: number; w: number; h: number }[] = []
  const drawn: Label[] = []
  for (const author of pins) {
    const [px, py] = project(author.lon, author.lat)
    if (px < frame.x || px > frame.x + frame.w || py < frame.y || py > frame.y + frame.h) continue
    const boxW = author.name.length * size * 0.56
    const boxH = size * 1.35
    const gap = size * 0.9
    const sides: { x: number; anchor: "start" | "end" }[] = [
      { x: px + gap, anchor: "start" },
      { x: px - gap, anchor: "end" },
    ]
    let spot: { x: number; y: number; anchor: "start" | "end" } | null = null
    for (let step = 0; step < 5 && !spot; step += 1) {
      const dy = (step === 0 ? 0 : Math.ceil(step / 2) * boxH * 1.15) * (step % 2 === 1 ? -1 : 1)
      for (const side of sides) {
        const y = py + dy - boxH / 2
        const left = side.anchor === "start" ? side.x : side.x - boxW
        const box = { x: left, y, w: boxW, h: boxH }
        const inside = box.x > frame.x && box.y > frame.y && box.x + box.w < frame.x + frame.w && box.y + box.h < frame.y + frame.h
        const hit = placed.some((other) => box.x < other.x + other.w && box.x + box.w > other.x && box.y < other.y + other.h && box.y + box.h > other.y)
        if (inside && !hit) {
          spot = { x: side.x, y: py + dy, anchor: side.anchor }
          placed.push(box)
          break
        }
      }
    }
    if (!spot) {
      spot = { x: px + gap, y: py, anchor: "start" }
    }
    drawn.push({ id: author.id, text: author.name, x: spot.x, y: spot.y, anchor: spot.anchor, pinX: px, pinY: py })
  }
  return drawn
}

export function MapPage() {
  const questions = mapQuestions()
  const pins = AUTHORS.filter((author) => author.onMap !== false)
  const [cursor, setCursor] = useState(0)
  const [progress, setProgress] = useState(() => loadGameProgress())
  const [frame, setFrame] = useState<Frame>(WORLD)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<{ right: boolean; text: string } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef(0)
  const question = questions[cursor % Math.max(questions.length, 1)]
  const answerAuthor = question ? authorById(question.authorId) : undefined
  const labels = revealed ? labelsFor(pins, frame) : []

  function answer(author: Author) {
    if (!question || revealed || !answerAuthor) return
    const right = checkCountry(question.authorId, author.country ?? "")
    const next = { ...progress, map: recordAnswer(progress.map, right) }
    setProgress(next)
    saveGameProgress(next)
    setPickedId(author.id)
    setFrame(frameAround(answerAuthor.lon, answerAuthor.lat))
    setRevealed({
      right,
      text: right
        ? `Yes. ${answerAuthor.name} was born in ${answerAuthor.birthplace}.`
        : `Not quite. That pin is ${author.name}. ${answerAuthor.name} was born in ${answerAuthor.birthplace}.`,
    })
  }

  function nextQuestion() {
    setRevealed(null)
    setPickedId(null)
    setFrame(WORLD)
    setCursor((value) => value + 1)
  }

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size < 2) return
    const [a, b] = [...pointers.current.values()]
    if (!a || !b) return
    const distance = Math.hypot(a.x - b.x, a.y - b.y)
    if (pinch.current > 0) {
      const factor = pinch.current / distance
      setFrame((current) => zoomFrame(current, factor))
    }
    pinch.current = distance
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) pinch.current = 0
  }

  return (
    <main data-testid="map" className="mx-auto max-w-6xl px-4 py-6">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">Literary map</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Tap a pin. Names stay hidden until you answer. Pinch or use the zoom buttons when several pins share a coast.
      </p>

      {question ? (
        <section data-testid="map-quiz" className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
              Question {(cursor % questions.length) + 1} of {questions.length}
            </p>
            <p className="text-sm">
              Score <span className="font-semibold text-primary">{progress.map.correct}</span> correct
            </p>
          </div>
          <h2 className="mt-2 font-serif text-2xl">Tap the birthplace of {answerAuthor?.name}.</h2>
          {revealed ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className={`text-sm ${revealed.right ? "text-primary" : "text-foreground"}`}>{revealed.text}</p>
              <Button onClick={nextQuestion}>Next question</Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">The pins are anonymous until you choose.</p>
          )}
        </section>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-primary/20 bg-wine-dark shadow-elevated sm:rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-cream/10 px-3 py-2">
          <Button size="sm" variant="line" onClick={() => setFrame(WORLD)}>
            World
          </Button>
          <Button size="sm" variant="line" onClick={() => setFrame(EUROPE)}>
            Europe
          </Button>
          <Button size="sm" variant="gold" onClick={() => setFrame((current) => zoomFrame(current, 0.72))}>
            Zoom in
          </Button>
          <Button size="sm" variant="line" onClick={() => setFrame((current) => zoomFrame(current, 1.4))}>
            Zoom out
          </Button>
        </div>
        <svg
          viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
          preserveAspectRatio="xMidYMid slice"
          className="-mx-4 h-[28rem] w-[calc(100%+2rem)] max-w-none touch-none sm:mx-0 sm:aspect-[2/1] sm:h-auto sm:w-full"
          role="img"
          aria-label="Birthplace map"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(event: WheelEvent<SVGSVGElement>) => {
            event.preventDefault()
            setFrame((current) => zoomFrame(current, event.deltaY > 0 ? 1.12 : 0.88))
          }}
        >
          <rect x={0} y={0} width={W} height={H} fill="hsl(350 50% 16%)" />
          <path d={WORLD_LAND_D} fill="hsl(40 42% 78%)" stroke="hsl(42 40% 42%)" strokeWidth={frame.w > 400 ? 0.7 : 0.25} />
          {pins.map((author) => {
            const [px, py] = project(author.lon, author.lat)
            const correct = revealed != null && author.id === question?.authorId
            const picked = pickedId === author.id
            const radius = Math.max(frame.w * 0.007, 0.7)
            return (
              <g key={author.id} className="cursor-pointer" onClick={() => (revealed ? null : answer(author))} data-pin={author.id}>
                {!revealed ? <title>Anonymous pin</title> : <title>{`${author.name}. ${author.placeNote}`}</title>}
                <circle cx={px} cy={py} r={radius * 2.4} fill="transparent" />
                <circle
                  cx={px}
                  cy={py}
                  r={correct ? radius * 1.7 : radius}
                  fill={correct ? "hsl(42 80% 62%)" : picked ? "hsl(0 55% 48%)" : "hsl(42 70% 55%)"}
                  stroke="hsl(30 25% 97%)"
                  strokeWidth={radius * 0.35}
                />
              </g>
            )
          })}
          {labels.map((label) => (
            <g key={label.id}>
              <line x1={label.pinX} y1={label.pinY} x2={label.x} y2={label.y} stroke="hsl(30 30% 92%)" strokeWidth={frame.w * 0.0015} />
              <text
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                dominantBaseline="middle"
                fill="hsl(30 25% 97%)"
                fontSize={frame.w * 0.028}
                fontFamily="Georgia, serif"
              >
                {label.text}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {revealed && answerAuthor ? (
        <aside className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">The pin</p>
          <p className="mt-1 font-serif text-2xl">{answerAuthor.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{answerAuthor.placeNote}</p>
          <Link
            to={`/book/${worksByAuthor(answerAuthor.id)[0]?.textId ?? worksByAuthor(answerAuthor.id)[0]?.id ?? ""}`}
            className="mt-2 inline-block text-sm text-primary"
          >
            Open a work
          </Link>
          <div className="relative mt-4 lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1 pr-8">
              {pins.map((author) => (
                <button
                  key={author.id}
                  type="button"
                  className="shrink-0 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs"
                  onClick={() => setFrame(frameAround(author.lon, author.lat))}
                >
                  {author.name}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
            <p className="text-[10px] tracking-wide text-muted-foreground uppercase">Swipe for the rest of the names</p>
          </div>
        </aside>
      ) : null}
    </main>
  )
}
