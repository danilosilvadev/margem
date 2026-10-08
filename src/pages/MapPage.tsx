import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AUTHORS, authorById, worksByAuthor } from "@shared/canon"
import { checkCountry, mapChoices, mapQuestions, recordAnswer } from "@shared/games"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { loadGameProgress, saveGameProgress } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

function pinStyle(lon: number, lat: number) {
  return { left: `${((lon + 180) / 360) * 100}%`, top: `${((90 - lat) / 180) * 100}%` }
}

export function MapPage() {
  const questions = useMemo(() => mapQuestions(), [])
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(() => loadGameProgress())
  const [note, setNote] = useState("")
  const question = questions[index % questions.length]
  const choices = question ? [...mapChoices(question.answer)].sort((a, b) => a.localeCompare(b)) : []

  function answer(guess: string) {
    if (!question) return
    const right = checkCountry(question.authorId, guess)
    const next = { ...progress, map: recordAnswer(progress.map, right) }
    setProgress(next)
    saveGameProgress(next)
    const name = authorById(question.authorId)?.name ?? "They"
    setNote(right ? `${name}: yes, ${question.answer}.` : `No. ${name} was born in ${question.answer}.`)
    setIndex((value) => value + 1)
  }

  return (
    <main data-testid="map" className="mx-auto max-w-6xl px-4 py-8">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">Literary map</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        An equirectangular plate. Pins sit on birthplaces, except Homer, whose pin is the Ionian coast of the tradition and is not a birthplace. Scores stay in this browser.
      </p>
      <p className="mt-3 text-sm">
        Map score {progress.map.correct}/{progress.map.answered}
      </p>
      <div className="relative mt-6 h-80 overflow-hidden rounded-2xl border border-primary/20 bg-wine-dark shadow-elevated sm:h-[28rem]">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--gold)/0.35),transparent_40%),radial-gradient(circle_at_70%_55%,hsl(var(--cream)/0.15),transparent_35%)]" />
        {AUTHORS.map((author) => (
          <Link
            key={author.id}
            to={`/book/${worksByAuthor(author.id)[0]?.textId ?? worksByAuthor(author.id)[0]?.id ?? ""}`}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={pinStyle(author.lon, author.lat)}
            title={`${author.name}. ${author.placeNote}`}
          >
            <span className="block h-3 w-3 rounded-full bg-gold ring-2 ring-cream/70" />
            <span className="mt-1 block max-w-24 text-[10px] leading-tight text-cream">{author.name.split(" ").at(-1)}</span>
          </Link>
        ))}
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {AUTHORS.map((author) => (
          <li key={author.id} className="rounded-xl border border-border bg-card p-3">
            <p className="font-serif">{author.name}</p>
            <p className="text-xs text-muted-foreground">{author.placeNote}</p>
          </li>
        ))}
      </ul>
      {question ? (
        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-serif text-2xl">Place them</h2>
          <p className="mt-2">{question.prompt}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {choices.map((choice) => (
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
