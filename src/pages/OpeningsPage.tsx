import { useMemo, useState } from "react"
import { Check, X } from "lucide-react"
import { OPENINGS } from "@shared/canon"
import { checkOpening, noteOpeningBest, openingChoices, openingCredit, orderOpenings, recordAnswer } from "@shared/games"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { loadGameProgress, saveGameProgress } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

export function OpeningsPage() {
  const [deck, setDeck] = useState(() => orderOpenings(OPENINGS))
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
  const credit = opening ? openingCredit(opening.id) : ""

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
    if (index + 1 >= deck.length) {
      const openings = noteOpeningBest(progress.openings, roundCorrect)
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
    setDeck(orderOpenings(OPENINGS))
    setIndex(0)
    setRoundCorrect(0)
    setPicked(null)
    setDone(false)
  }

  return (
    <main data-testid="openings" className="mx-auto max-w-3xl px-4 py-6">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">Opening lines</h1>
      <p className="mt-2 text-sm text-muted-foreground">{deck.length} lines, shuffled, from public-domain wording. The Raven is never first.</p>
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
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left ${
                    correct
                      ? "border-emerald-700 bg-emerald-100 text-emerald-950"
                      : chosen
                        ? "border-red-700 bg-red-100 text-red-950"
                        : "border-border bg-background hover:border-primary"
                  }`}
                >
                  {correct ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : null}
                  {chosen && !correct ? <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : null}
                  <span>
                    <span className="block font-serif">{choice.title}</span>
                    <span className={`block text-xs ${correct || chosen ? "opacity-80" : "text-muted-foreground"}`}>{choice.author}</span>
                  </span>
                </button>
              )
            })}
          </div>
          {picked ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm">{picked === opening.workId ? `Yes: ${credit}.` : `Not quite: it's ${credit}.`}</p>
              <Button onClick={advance}>{index + 1 >= deck.length ? "See the score" : "Next line"}</Button>
            </div>
          ) : null}
        </article>
      ) : null}
    </main>
  )
}
