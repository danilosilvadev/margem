import { LANGS, type Book, type Lang } from "./types.ts"

function isLang(value: unknown): value is Lang {
  return value === "en" || value === "pt" || value === "es"
}

export function assertBook(value: unknown): Book {
  if (typeof value !== "object" || value === null) throw new Error("Book file is not an object")
  const book = value as Book
  if (!/^[a-z0-9-]{1,64}$/.test(book.id)) throw new Error("Book id is invalid")
  if (!Array.isArray(book.languages) || book.languages.some((lang) => !isLang(lang))) {
    throw new Error("Book languages are invalid")
  }
  for (const lang of LANGS) {
    if (typeof book.title?.[lang] !== "string" || !book.title[lang]) throw new Error(`Missing title for ${lang}`)
  }
  if (!Array.isArray(book.chapters) || book.chapters.length === 0) throw new Error("Book has no chapters")
  const seen = new Set<string>()
  for (const chapter of book.chapters) {
    if (!/^[a-z0-9-]{1,64}$/.test(chapter.id)) throw new Error("Chapter id is invalid")
    if (seen.has(chapter.id)) throw new Error(`Duplicate chapter ${chapter.id}`)
    seen.add(chapter.id)
    if (!Array.isArray(chapter.paragraphs) || chapter.paragraphs.length === 0) {
      throw new Error(`Chapter ${chapter.id} has no paragraphs`)
    }
    const ids = new Set<string>()
    for (const paragraph of chapter.paragraphs) {
      if (!/^[a-z0-9-]{1,64}$/.test(paragraph.id)) throw new Error("Paragraph id is invalid")
      if (ids.has(paragraph.id)) throw new Error(`Duplicate paragraph ${paragraph.id}`)
      ids.add(paragraph.id)
      for (const lang of book.languages) {
        const text = paragraph[lang]
        if (typeof text !== "string" || !text.trim()) {
          throw new Error(`Paragraph ${paragraph.id} is missing ${lang}`)
        }
      }
    }
  }
  return book
}
