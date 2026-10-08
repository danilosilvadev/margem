import { assertBook } from "@shared/books"
import type { Book, CatalogBook } from "@shared/types"
import { cacheBook, cacheCatalog, cachedBook, cachedCatalog } from "@/lib/db"
import { publicUrl } from "@/lib/public-url"

export async function loadCatalog(): Promise<CatalogBook[]> {
  try {
    const response = await fetch(publicUrl("catalog.json"))
    if (!response.ok) throw new Error("Catalog request failed")
    const body = await response.text()
    await cacheCatalog(body)
    return (JSON.parse(body) as { books: CatalogBook[] }).books
  } catch (error) {
    const cached = await cachedCatalog()
    if (!cached) throw error instanceof Error ? error : new Error("Catalog is unavailable")
    return (JSON.parse(cached) as { books: CatalogBook[] }).books
  }
}

export async function loadBook(id: string): Promise<Book> {
  const cached = await cachedBook(id)
  try {
    const response = await fetch(publicUrl(`books/${id}.json`))
    if (!response.ok) throw new Error("Book request failed")
    const book = assertBook(await response.json())
    await cacheBook(book)
    return book
  } catch (error) {
    if (cached) return cached
    throw error instanceof Error ? error : new Error("This book is not on this device yet")
  }
}
