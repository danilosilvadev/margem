import { AUTHORS, INFLUENCES, OPENINGS, authorById, workById } from "./canon.ts"

export type Tally = { correct: number; answered: number }

export type GameProgress = {
  map: Tally
  tree: Tally
  openings: Tally & { best: number }
  journey: string[]
}

export const EMPTY_PROGRESS: GameProgress = {
  map: { correct: 0, answered: 0 },
  tree: { correct: 0, answered: 0 },
  openings: { correct: 0, answered: 0, best: 0 },
  journey: [],
}

export function recordAnswer(tally: Tally, right: boolean): Tally {
  return { correct: tally.correct + (right ? 1 : 0), answered: tally.answered + 1 }
}

export function noteOpeningBest(progress: GameProgress["openings"], roundCorrect: number): GameProgress["openings"] {
  return { ...progress, best: Math.max(progress.best, roundCorrect) }
}

/** Birthplace country. Authors with no known birthplace are not questions. */
export function mapQuestions(): { authorId: string; prompt: string; answer: string }[] {
  return AUTHORS.filter((author) => author.country).map((author) => ({
    authorId: author.id,
    prompt: `Where was ${author.name} born?`,
    answer: author.country as string,
  }))
}

export function mapChoices(answer: string): string[] {
  const countries = [...new Set(AUTHORS.map((author) => author.country).filter((country): country is string => Boolean(country)))]
  const wrong = countries.filter((country) => country !== answer)
  return [answer, ...wrong.slice(0, 3)]
}

export function checkCountry(authorId: string, guess: string): boolean {
  return authorById(authorId)?.country === guess
}

export function treeQuestions(): { id: string; prompt: string; answer: string; choices: string[] }[] {
  return INFLUENCES.map((edge) => {
    const from = authorById(edge.from)
    const to = authorById(edge.to)
    const names = AUTHORS.map((author) => author.name).filter((name) => name !== from?.name && name !== to?.name)
    return {
      id: `${edge.from}-${edge.to}`,
      prompt: to ? `Who stands behind ${to.name} on this tree?` : edge.note,
      answer: from?.name ?? "",
      choices: [from?.name ?? "", names[0] ?? "", names[1] ?? ""].filter(Boolean),
    }
  })
}

export function checkInfluence(questionId: string, guess: string): boolean {
  const edge = INFLUENCES.find((item) => `${item.from}-${item.to}` === questionId)
  return authorById(edge?.from ?? "")?.name === guess
}

export function openingChoices(answerWorkId: string): { id: string; title: string }[] {
  const titles = new Map<string, string>()
  for (const opening of OPENINGS) {
    if (opening.workId === "moby-dick-line") titles.set(opening.workId, "Moby-Dick")
    else titles.set(opening.workId, workById(opening.workId)?.title ?? opening.workId)
  }
  const answer = titles.get(answerWorkId) ?? answerWorkId
  const rest = [...titles.entries()].filter(([id]) => id !== answerWorkId).slice(0, 3)
  return [{ id: answerWorkId, title: answer }, ...rest.map(([id, title]) => ({ id, title }))]
}

export function checkOpening(openingId: string, workId: string): boolean {
  return OPENINGS.find((opening) => opening.id === openingId)?.workId === workId
}

export function visitEra(visited: string[], eraId: string): string[] {
  return visited.includes(eraId) ? visited : [...visited, eraId]
}
