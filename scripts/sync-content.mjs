import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const content = path.join(root, "content")
const booksDir = path.join(root, "public", "books")
await mkdir(booksDir, { recursive: true })
const books = []
for (const entry of await readdir(content, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const file = path.join(content, entry.name, "book.json")
  const book = JSON.parse(await readFile(file, "utf8"))
  if (typeof book.id !== "string" || !Array.isArray(book.chapters)) {
    throw new Error(`Invalid book file: ${file}`)
  }
  await writeFile(path.join(booksDir, `${book.id}.json`), JSON.stringify(book))
  books.push({
    ...book,
    chapters: book.chapters.map(({ paragraphs, ...chapter }) => ({
      ...chapter,
      paragraphCount: paragraphs.length,
    })),
  })
}
await writeFile(path.join(root, "public", "catalog.json"), `${JSON.stringify({ books }, null, 2)}\n`)
console.log(`catalog: ${books.map((book) => book.id).join(", ")}`)
