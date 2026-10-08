import { useState } from "react"
import { Link } from "react-router-dom"
import { AUTHORS, ERAS, WORKS } from "@shared/canon"
import { visitEra } from "@shared/games"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { loadGameProgress, saveGameProgress } from "@/lib/game-store"
import { Button } from "@/components/ui/button"

export function JourneyPage() {
  const [progress, setProgress] = useState(() => loadGameProgress())
  const [open, setOpen] = useState<string>(ERAS[0]?.id ?? "ancient")
  const era = ERAS.find((item) => item.id === open) ?? ERAS[0]

  function walk(id: string) {
    setOpen(id)
    const next = { ...progress, journey: visitEra(progress.journey, id) }
    setProgress(next)
    saveGameProgress(next)
  }

  return (
    <main data-testid="journey" className="mx-auto max-w-3xl px-4 py-8">
      <LiteraryTabs />
      <h1 className="font-serif text-4xl">A journey through the shelf</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Four stretches of time, only as far as the works on this shelf. {progress.journey.length} of {ERAS.length} opened on this device.
      </p>
      <ol className="mt-8 space-y-4 border-l border-primary/30 pl-6">
        {ERAS.map((item) => (
          <li key={item.id}>
            <button type="button" className="text-left" onClick={() => walk(item.id)}>
              <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{item.range}</p>
              <p className={`font-serif text-2xl ${progress.journey.includes(item.id) ? "text-primary" : ""}`}>{item.name}</p>
            </button>
          </li>
        ))}
      </ol>
      {era ? (
        <article className="mt-8 rounded-2xl bg-hero p-6 text-cream shadow-elevated">
          <p className="text-xs tracking-[0.18em] text-gold uppercase">{era.range}</p>
          <h2 className="mt-2 font-serif text-3xl">{era.name}</h2>
          <p className="mt-3 text-cream/80">{era.summary}</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            {era.beats.map((beat) => (
              <li key={beat}>{beat}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {WORKS.filter((work) => AUTHORS.find((author) => author.id === work.authorId)?.era === era.id).map((work) => (
              <Link key={work.id} to={`/book/${work.textId ?? work.id}`} className="rounded-full bg-cream/10 px-3 py-1 text-xs text-cream">
                {work.title}
              </Link>
            ))}
          </div>
          <div className="mt-5">
            <Button
              variant="gold"
              onClick={() => {
                const nextIndex = (ERAS.findIndex((item) => item.id === era.id) + 1) % ERAS.length
                const next = ERAS[nextIndex]
                if (next) walk(next.id)
              }}
            >
              Next stretch
            </Button>
          </div>
        </article>
      ) : null}
    </main>
  )
}
