import { useState } from "react"
import { OPENINGS } from "@shared/canon"
import { checkOpening, noteOpeningBest, openingChoices, recordAnswer } from "@shared/games"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { loadGameProgress, saveGameProgress } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

export function OpeningsPage() {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(() => loadGameProgress())
  const [roundCorrect, setRoundCorrect] = useState(0)
  const [note, setNote] = useState("")
  const opening = OPENINGS[index]
  const choices = opening
    ? [...openingChoices(opening.workId)].sort((a, b) => (a.id + opening.id).localeCompare(b.id + opening.id))
    : []

  function answer(workId: string) {
    if (!opening) return
    const right = checkOpening(opening.id, workId)
    const tally = recordAnswer(progress.openings, right)
    const nextRound = roundCorrect + (right ? 1 : 0)
    const finished = index + 1 >= OPENINGS.length
    const openings = finished ? noteOpeningBest({ ...tally, best: progress.openings.best }, nextRound) : { ...tally, best: progress.openings.best }
    const next = { ...progress, openings }
    setProgress(next)
    saveGameProgress(next)
    setNote(right ? opening.citation : `No. ${opening.citation}`)
    if (finished) {
      setRoundCorrect(0)
      setIndex(0)
    } else {
      setRoundCorrect(nextRound)
      setIndex((value) => value + 1)
    }
  }

  return (
    <main data-testid="openings" className="mx-auto max-w-3xl px-4 py-8">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">Opening lines</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Five first lines, each from a text old enough to quote. Best round on this device: {progress.openings.best}/{OPENINGS.length}. Answered {progress.openings.answered}, {progress.openings.correct} right.
      </p>
      {opening ? (
        <article className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <p className="font-serif text-2xl leading-snug">“{opening.quote}”</p>
          <div className="mt-5 flex flex-col gap-2">
            {choices.map((choice) => (
              <Button key={choice.id} variant="line" onClick={() => answer(choice.id)}>
                {choice.title}
              </Button>
            ))}
          </div>
          {note ? <p className="mt-4 text-sm text-muted-foreground">{note}</p> : null}
        </article>
      ) : null}
    </main>
  )
}
