import { useMemo, useState } from "react"
import { OPENINGS, type Opening } from "@shared/canon"
import { checkOpening, noteOpeningBest, openingChoices, recordAnswer } from "@shared/games"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { loadGameProgress, saveGameProgress } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

function shuffle(lines: Opening[]): Opening[] {
  const next = [...lines]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = next[index]
    next[index] = next[swap] as Opening
    next[swap] = current as Opening
  }
  return next
}

export function OpeningsPage() {
  const [deck, setDeck] = useState(() => shuffle(OPENINGS))
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(() => loadGameProgress())
  const [roundCorrect, setRoundCorrect] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const opening = deck[index]
  const choices = useMemo(() => {
    if (!opening) return []
    return [...openingChoices(opening.workId)].sort((a, b) => a.title.localeCompare(b.title) || a.author.localeCompare(b.author))
  }, [opening])

  function answer(workId: string) {
    if (!opening || picked) return
    const right = checkOpening(opening.id, workId)
    const tally = recordAnswer(progress.openings, right)
    const next = { ...progress, openings: { ...tally, best: progress.openings.best } }
    setProgress(next)
    saveGameProgress(next)
    setRoundCorrect((value) => value + (right ? 1 : 0))
    setPicked(workId)
  }

  function advance() {
    if (!opening || !picked) return
    const correctNow = roundCorrect
    if (index + 1 >= deck.length) {
      const openings = noteOpeningBest(progress.openings, correctNow)
      const next = { ...progress, openings }
      setProgress(next)
      saveGameProgress(next)
      setDone(true)
      return
    }
    setPicked(null)
    setIndex((value) => value + 1)
  }

  function again() {
    setDeck(shuffle(OPENINGS))
    setIndex(0)
    setRoundCorrect(0)
    setPicked(null)
    setDone(false)
  }

  return (
    <main data-testid="openings" className="mx-auto max-w-3xl px-4 py-6">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">Opening lines</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {deck.length} lines, shuffled, from public-domain wording. Best round on this device: {progress.openings.best}/{deck.length}. Running score {progress.openings.correct} correct of {progress.openings.answered}.
      </p>
      {done ? (
        <article className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Round complete</p>
          <h2 className="mt-2 font-serif text-3xl">
            {roundCorrect} of {deck.length}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Best on this device is {progress.openings.best}.</p>
          <Button className="mt-4" onClick={again}>
            Play again
          </Button>
        </article>
      ) : opening ? (
        <article className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
              {index + 1} / {deck.length}
            </p>
            <p className="text-sm">This round {roundCorrect} correct</p>
          </div>
          <p className="mt-3 font-serif text-2xl leading-snug">“{opening.quote}”</p>
          <div className="mt-5 grid gap-2">
            {choices.map((choice) => {
              const chosen = picked === choice.id
              const correct = picked != null && choice.id === opening.workId
              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={picked != null}
                  onClick={() => answer(choice.id)}
                  className={`rounded-lg border px-4 py-3 text-left ${correct ? "border-gold bg-parchment" : chosen ? "border-primary bg-secondary" : "border-border bg-background hover:border-primary"}`}
                >
                  <span className="block font-serif">{choice.title}</span>
                  <span className="block text-xs text-muted-foreground">{choice.author}</span>
                </button>
              )
            })}
          </div>
          {picked ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm">{picked === opening.workId ? "Yes." : "No."} {opening.citation}</p>
              <Button onClick={advance}>{index + 1 >= deck.length ? "See the score" : "Next line"}</Button>
            </div>
          ) : null}
        </article>
      ) : null}
    </main>
  )
}
