import { useState } from "react"
import { Link } from "react-router-dom"
import { AUTHORS, ERAS, INFLUENCES, authorById, worksByAuthor } from "@shared/canon"
import { checkInfluence, recordAnswer, treeQuestions } from "@shared/games"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { loadGameProgress, saveGameProgress } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

export function TreePage() {
  const questions = treeQuestions()
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(() => loadGameProgress())
  const [note, setNote] = useState("")
  const question = questions[index % Math.max(questions.length, 1)]

  function answer(guess: string) {
    if (!question) return
    const right = checkInfluence(question.id, guess)
    const next = { ...progress, tree: recordAnswer(progress.tree, right) }
    setProgress(next)
    saveGameProgress(next)
    const edge = INFLUENCES.find((item) => `${item.from}-${item.to}` === question.id)
    setNote(right ? edge?.note ?? "Yes." : edge?.note ?? "No.")
    setIndex((value) => value + 1)
  }

  return (
    <main data-testid="tree" className="mx-auto max-w-5xl px-4 py-8">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">A small family tree</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Only four arrows. Each one is a poem naming its model, or a published translation. Score {progress.tree.correct}/{progress.tree.answered}, kept on this device.
      </p>
      <div className="mt-8 space-y-8">
        {ERAS.map((era) => {
          const people = AUTHORS.filter((author) => author.era === era.id)
          if (people.length === 0) return null
          return (
            <section key={era.id}>
              <h2 className="font-serif text-xl text-primary">{era.name}</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {people.map((author) => {
                  const work = worksByAuthor(author.id)[0]
                  return (
                    <Link key={author.id} to={work ? `/book/${work.textId ?? work.id}` : "/tree"} className="w-48 rounded-xl border border-border bg-card p-3 shadow-soft hover:border-primary">
                      <p className="font-serif">{author.name}</p>
                      <p className="text-xs text-muted-foreground">{author.life}</p>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
      <ul className="mt-8 space-y-3">
        {INFLUENCES.map((edge) => (
          <li key={`${edge.from}-${edge.to}`} className="rounded-xl border border-gold/30 bg-parchment px-4 py-3 text-sm">
            <span className="font-serif">{authorById(edge.from)?.name}</span>
            <span className="text-muted-foreground"> → </span>
            <span className="font-serif">{authorById(edge.to)?.name}</span>
            <p className="mt-1 text-muted-foreground">{edge.note}</p>
          </li>
        ))}
      </ul>
      {question ? (
        <section className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-serif text-2xl">{question.prompt}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {[...question.choices].sort((a, b) => a.localeCompare(b)).map((choice) => (
              <Button key={choice} variant="line" onClick={() => answer(choice)}>
                {choice}
              </Button>
            ))}
          </div>
          {note ? <p className="mt-3 text-sm text-muted-foreground">{note}</p> : null}
        </section>
      ) : null}
    </main>
  )
}
