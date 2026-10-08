import { describe, expect, it } from "vitest"
import { CANON_AUTHORS, ancestralChainOf, eraOf, findCanonAuthor, formatMark, formatYear } from "../shared/literary-canon.ts"
import { CONTINENTS, GENRES, MAP_ERAS, MAP_SECTIONS, SCHOOLS, SPECIALS } from "../shared/literary-maps.ts"
import { shelfBooks } from "../src/lib/shelf-books.ts"

const ALL = [...CONTINENTS, ...MAP_ERAS, ...SCHOOLS, ...GENRES, ...SPECIALS]

describe("literary map collections", () => {
  it("keeps collection ids unique and grouped", () => {
    const ids = ALL.map((collection) => collection.id)
    expect(new Set(ids).size).toBe(ids.length)
    const grouped = MAP_SECTIONS.flatMap((section) => section.collections.map((collection) => collection.id))
    for (const id of ids) expect(grouped).toContain(id)
  })

  it("puts a Russian book in Europe and not a Brazilian one", () => {
    const europe = CONTINENTS.find((collection) => collection.id === "europa")!
    expect(europe.filter({ nationality: "Russian" })).toBe(true)
    expect(europe.filter({ nationality: "Brazilian" })).toBe(false)
  })

  it("gives region maps a country filter", () => {
    for (const collection of SPECIALS.filter((item) => item.variant === "region-cover")) {
      expect(collection.regions?.length).toBeGreaterThan(0)
      expect(typeof collection.countryFilter).toBe("function")
    }
    expect(SPECIALS[0]?.variant).toBe("world-cover")
  })
})

describe("literary canon", () => {
  it("formats years and era marks in English", () => {
    expect(formatYear(-474)).toBe("474 BCE")
    expect(formatMark("Trojan War (-1200)")).toBe("Trojan War (1200 BCE)")
    expect(eraOf(-750).name).toBe("Greek Antiquity")
    expect(eraOf(1915).name).toBe("Modernism")
  })

  it("keeps Homer at the root and dashes authors who are not on the shelf", () => {
    const homer = findCanonAuthor("homer")
    expect(homer?.ghost).toBe(false)
    expect(homer?.workIds).toContain("iliad")
    expect(findCanonAuthor("shakespeare")?.ghost).toBe(false)
    expect(findCanonAuthor("sterne")?.ghost).toBe(true)
    expect(ancestralChainOf("machado").map((author) => author.id)).toContain("sterne")
    expect(CANON_AUTHORS.filter((author) => author.ghost).length).toBeGreaterThan(10)
  })

  it("places every shelf work that has a nationality onto the atlas", () => {
    const books = shelfBooks()
    expect(books.map((book) => book.id)).toEqual(expect.arrayContaining(["iliad", "quixote", "hamlet", "dom-casmurro", "metamorphosis"]))
    expect(books.find((book) => book.id === "the-raven")?.nationality).toBe("American")
  })
})
