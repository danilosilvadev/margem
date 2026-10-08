import { AUTHORS, WORKS } from "@shared/canon"

const NATIONALITY: Record<string, string> = {
  homer: "Greek",
  sophocles: "Greek",
  aeschylus: "Greek",
  virgil: "Roman",
  seneca: "Roman",
  dante: "Italian",
  petrarch: "Italian",
  boccaccio: "Italian",
  cervantes: "Spanish",
  shakespeare: "English",
  austen: "English",
  shelley: "English",
  milton: "English",
  dickens: "English",
  poe: "American",
  machado: "Brazilian",
  dostoevsky: "Russian",
  tolstoy: "Russian",
  gogol: "Russian",
  kafka: "Czech",
  goethe: "German",
  baudelaire: "French",
  rousseau: "French",
}

export type ShelfBook = {
  id: string
  title: string
  authorName: string
  nationality: string
  genre: string
  publicationYear: number
}

/** The public-domain shelf, shaped the way the literary maps filter it. */
export function shelfBooks(): ShelfBook[] {
  const books: ShelfBook[] = []
  for (const work of WORKS) {
    const author = AUTHORS.find((item) => item.id === work.authorId)
    const nationality = author ? NATIONALITY[author.id] : undefined
    if (!author || !nationality) continue
    books.push({
      id: work.id,
      title: work.title,
      authorName: author.name,
      nationality,
      genre: work.genre,
      publicationYear: work.year,
    })
  }
  return books
}

export function sortByMostRead(books: ShelfBook[], popularity: Map<string, number>): ShelfBook[] {
  return [...books].sort((a, b) => {
    const score = (popularity.get(b.id) ?? 0) - (popularity.get(a.id) ?? 0)
    if (score !== 0) return score
    return a.publicationYear - b.publicationYear
  })
}
