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

/** Birthplace country. No known birthplace, and names kept off the map, are not questions. */
export function mapQuestions(): { authorId: string; prompt: string; answer: string }[] {
  return AUTHORS.filter((author) => author.country && author.onMap !== false).map((author) => ({
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

export function treeQuestions(): { id: string; prompt: string; answer: string; choices: string[]; subjectId: string }[] {
  return INFLUENCES.map((edge, index) => {
    const from = authorById(edge.from)
    const to = authorById(edge.to)
    const names = AUTHORS.map((author) => author.name).filter((name) => name !== from?.name && name !== to?.name)
    const wrongA = names[index % names.length] ?? ""
    const wrongB = names[(index + 5) % names.length] ?? ""
    const choices = [...new Set([from?.name ?? "", wrongA, wrongB])].filter(Boolean)
    return {
      id: `${edge.from}-${edge.to}`,
      prompt: to ? `Who influenced ${to.name}?` : edge.note,
      subjectId: edge.to,
      answer: from?.name ?? "",
      choices,
    }
  })
}

export function checkInfluence(questionId: string, guess: string): boolean {
  const edge = INFLUENCES.find((item) => `${item.from}-${item.to}` === questionId)
  return authorById(edge?.from ?? "")?.name === guess
}

export function openingChoices(answerWorkId: string): { id: string; title: string; author: string }[] {
  const unique = new Map<string, { title: string; author: string }>()
  for (const opening of OPENINGS) {
    if (!unique.has(opening.workId)) unique.set(opening.workId, { title: opening.title, author: opening.author })
  }
  const answer = unique.get(answerWorkId) ?? { title: workById(answerWorkId)?.title ?? answerWorkId, author: "" }
  const rest = [...unique.entries()].filter(([id]) => id !== answerWorkId)
  const start = [...answerWorkId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % Math.max(rest.length, 1)
  const wrong = [0, 1, 2].map((offset) => rest[(start + offset) % rest.length]).filter((item): item is [string, { title: string; author: string }] => Boolean(item))
  return [
    { id: answerWorkId, title: answer.title, author: answer.author },
    ...wrong.map(([id, value]) => ({ id, title: value.title, author: value.author })),
  ]
}

const OPENING_WHEN: Record<string, string> = {
  "raven-open": "1845",
  "austen-open": "1813",
  "melville-open": "1851",
  "ormsby-open": "1605, in John Ormsby’s 1885 English",
  "garnett-open": "1877, in Constance Garnett’s 1901 English",
  "carol-open": "1843",
  "eyre-open": "1847",
  "cities-open": "1859",
  "alice-open": "1865",
  "frank-open": "1818",
  "dracula-open": "1897",
  "dorian-open": "1891",
  "heart-open": "1899",
  "kafka-open": "1915, in Kafka’s German",
}

export function openingCredit(openingId: string): string {
  const opening = OPENINGS.find((item) => item.id === openingId)
  if (!opening) return ""
  const when = OPENING_WHEN[opening.id]
  return when ? `${opening.title}, ${opening.author}, ${when}` : `${opening.title}, ${opening.author}`
}

/** Shuffle a round. The Raven is never the first card. */
export function orderOpenings<T extends { workId: string }>(lines: T[], random: () => number = Math.random): T[] {
  const next = [...lines]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const current = next[index]
    next[index] = next[swap] as T
    next[swap] = current as T
  }
  if (next[0]?.workId === "the-raven" && next.length > 1) {
    const swap = 1 + Math.floor(random() * (next.length - 1))
    const current = next[0]
    next[0] = next[swap] as T
    next[swap] = current as T
  }
  return next
}

export function checkOpening(openingId: string, workId: string): boolean {
  return OPENINGS.find((opening) => opening.id === openingId)?.workId === workId
}

export function visitEra(visited: string[], eraId: string): string[] {
  return visited.includes(eraId) ? visited : [...visited, eraId]
}
