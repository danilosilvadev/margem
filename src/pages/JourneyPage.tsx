import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AUTHORS, ERAS, WORKS, authorById } from "@shared/canon"
import { visitEra } from "@shared/games"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { loadGameProgress, saveGameProgress } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

const STEPS = ["To 19 BCE", "1265–1616", "1775–1910", "1883–1924"]

const TEASERS = [
  "Greek epic and Athenian tragedy, then a Latin poem written in their shadow.",
  "Three works between Dante’s birth and 1616. The shelf is empty for the long gap before them.",
  "Novels and one poem, from 1775 to 1910. The years after 1616 are a gap, not a claim that nothing was written.",
  "One lifetime that begins while the novels above are still being written. Not a whole century.",
]

export function JourneyPage() {
  const [progress, setProgress] = useState(() => loadGameProgress())
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const era = ERAS[step] ?? ERAS[0]
  const works = useMemo(
    () => WORKS.filter((work) => AUTHORS.find((author) => author.id === work.authorId)?.era === era?.id),
    [era],
  )
  const answer = works[0]
  const choices = useMemo(() => {
    if (!answer) return []
    const pool = WORKS.filter((work) => authorById(work.authorId)?.era !== era?.id)
    const seen = new Set<string>([answer.id])
    const others = []
    for (let offset = 0; others.length < 3 && offset < pool.length; offset += 1) {
      const work = pool[(step + offset) % pool.length]
      if (work && !seen.has(work.id)) {
        seen.add(work.id)
        others.push(work)
      }
    }
    return [answer, ...others].sort((a, b) => a.title.localeCompare(b.title))
  }, [answer, era, step])

  function go(index: number) {
    const nextEra = ERAS[index]
    if (!nextEra) return
    setStep(index)
    setPicked(null)
    const next = { ...progress, journey: visitEra(progress.journey, nextEra.id) }
    setProgress(next)
    saveGameProgress(next)
  }

  if (!era) return null
  const right = picked != null && picked === answer?.id

  return (
    <main data-testid="journey" className="mx-auto max-w-3xl px-4 py-6">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">A journey through the shelf</h1>
      <p className="mt-2 text-sm text-muted-foreground">Step {step + 1} of {ERAS.length}. Place a work before the stretch opens.</p>
      <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => go(index)}
              disabled={index > step && picked == null}
              className={`w-full rounded-lg border px-2 py-2 text-center disabled:opacity-40 ${index === step ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
            >
              <span className="block text-[10px] tracking-[0.14em] uppercase">{index + 1} / {ERAS.length}</span>
              <span className="mt-1 block font-serif text-sm leading-tight whitespace-nowrap">{label}</span>
            </button>
          </li>
        ))}
      </ol>
      <article className="mt-4 rounded-2xl bg-hero p-5 text-cream shadow-elevated sm:p-6">
        <p className="text-xs tracking-[0.18em] text-gold uppercase">{picked ? era.range : STEPS[step]}</p>
        <h2 className="mt-2 font-serif text-3xl">{picked ? era.name : `Stretch ${step + 1}`}</h2>
        <p className="mt-3 text-sm text-cream/80">{picked ? era.summary : TEASERS[step]}</p>
        {answer ? (
          <div className="mt-5 rounded-xl bg-wine-dark/50 p-4">
            <p className="text-xs tracking-[0.14em] text-gold uppercase">Which work belongs in this stretch?</p>
            <div className="mt-3 grid gap-2">
              {choices.map((work) => {
                const chosen = picked === work.id
                const show = picked != null && work.id === answer.id
                return (
                  <button
                    key={work.id}
                    type="button"
                    disabled={picked != null}
                    onClick={() => setPicked(work.id)}
                    className={`rounded-lg px-3 py-2 text-left text-sm ${show ? "bg-gold text-wine-dark" : chosen ? "bg-red-950/40 ring-2 ring-red-300" : "bg-cream/5 hover:bg-cream/10"}`}
                  >
                    <span className="font-serif">{work.title}</span>
                    {picked ? <span className="mt-0.5 block text-xs opacity-80">{work.yearLabel}</span> : null}
                  </button>
                )
              })}
            </div>
            {picked ? (
              <p className="mt-3 text-sm">
                {right ? `Yes. ${answer.title} belongs here (${answer.yearLabel}).` : `Not quite. ${answer.title} is the one in this stretch (${answer.yearLabel}).`}
              </p>
            ) : null}
          </div>
        ) : null}
        {picked ? (
          <>
            <ul className="mt-4 space-y-2 text-sm text-cream/85">
              {era.beats.map((beat) => (
                <li key={beat}>{beat}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {works.map((work) => (
                <Link key={work.id} to={`/book/${work.textId ?? work.id}`} className="rounded-full bg-cream/10 px-3 py-1 text-xs text-cream">
                  {work.title}
                  <span className="text-cream/60"> · {authorById(work.authorId)?.name}</span>
                </Link>
              ))}
            </div>
          </>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button variant="line" disabled={step === 0} onClick={() => go(step - 1)}>
            Back
          </Button>
          <Button variant="gold" disabled={step === ERAS.length - 1 || picked == null} onClick={() => go(step + 1)}>
            Next stretch
          </Button>
        </div>
      </article>
    </main>
  )
}
