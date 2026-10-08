import { describe, expect, it } from "vitest"
import { AUTHORS, INFLUENCES, OPENINGS, WORKS, authorById } from "../shared/canon.ts"
import { letters, readingRooms, trendingBooks } from "../shared/community.ts"
import { KIND, signEvent } from "../shared/events.ts"
import { checkCountry, checkInfluence, checkOpening, noteOpeningBest, recordAnswer, visitEra } from "../shared/games.ts"
import { createIdentity } from "../shared/identity.ts"

describe("canon", () => {
  it("keeps Homer off the birthplace game and documents the four arrows", () => {
    expect(authorById("homer")?.country).toBeNull()
    expect(INFLUENCES.map((edge) => `${edge.from}->${edge.to}`)).toEqual([
      "homer->virgil",
      "aeschylus->sophocles",
      "virgil->dante",
      "virgil->petrarch",
      "dante->boccaccio",
      "seneca->shakespeare",
      "shakespeare->goethe",
      "milton->shelley",
      "poe->baudelaire",
      "poe->machado",
      "poe->perez-bonalde",
      "gogol->dostoevsky",
      "rousseau->tolstoy",
      "dickens->kafka",
    ])
    expect(WORKS.find((work) => work.id === "the-raven")?.textId).toBe("the-raven")
    expect(AUTHORS.filter((author) => author.country && author.onMap !== false).length).toBeGreaterThan(8)
    expect(authorById("perez-bonalde")?.onMap).toBe(false)
    expect(authorById("machado")?.name).toBe("Machado de Assis")
    expect(OPENINGS.length).toBeGreaterThanOrEqual(10)
    expect(OPENINGS.every((line) => line.author && line.title && line.citation)).toBe(true)
  })
})

describe("community feeds", () => {
  it("counts a recent note toward trending and hides a blocked letter", async () => {
    const reader = await createIdentity()
    const owner = await createIdentity()
    const ghost = await createIdentity()
    const now = Math.floor(Date.now() / 1000)
    const note = await signEvent(
      { pubkey: reader.publicKey, created_at: now, kind: KIND.comment, tags: [["b", "the-raven"], ["c", "poem"]], content: "A mark." },
      reader.secretKey,
    )
    const old = await signEvent(
      { pubkey: reader.publicKey, created_at: now - 10 * 24 * 60 * 60, kind: KIND.marginalia, tags: [["b", "quixote"]], content: JSON.stringify({ quote: "La Mancha", note: "old" }) },
      reader.secretKey,
    )
    const room = await signEvent(
      { pubkey: reader.publicKey, created_at: now, kind: KIND.readingRoom, tags: [["b", "the-raven"]], content: JSON.stringify({ title: "Monday night", note: "Stanza one" }) },
      reader.secretKey,
    )
    const letter = await signEvent(
      { pubkey: ghost.publicKey, created_at: now, kind: KIND.letter, tags: [], content: JSON.stringify({ body: "I am not my name.", regarding: "The Raven" }) },
      ghost.secretKey,
    )
    const list = await signEvent(
      {
        pubkey: owner.publicKey,
        created_at: now,
        kind: KIND.blocklist,
        tags: [["d", "blocklist"]],
        content: JSON.stringify({ blockedPubkeys: [ghost.publicKey], blockedEventIds: [] }),
      },
      owner.secretKey,
    )
    const events = [note, old, room, letter, list]
    expect(trendingBooks(events, owner.publicKey, Date.now())).toEqual([{ bookId: "the-raven", count: 2 }])
    expect(readingRooms(events, owner.publicKey)[0]?.title).toBe("Monday night")
    expect(letters(events, owner.publicKey)).toEqual([])
    expect(letters([letter], owner.publicKey)).toHaveLength(1)
  })
})

describe("literary games", () => {
  it("scores a birthplace, an influence, an opening line, and a journey", () => {
    expect(checkCountry("poe", "United States")).toBe(true)
    expect(checkCountry("homer", "Greece")).toBe(false)
    expect(checkInfluence("poe-machado", "Edgar Allan Poe")).toBe(true)
    expect(checkOpening("austen-open", "pride")).toBe(true)
    expect(visitEra(["ancient"], "ancient")).toEqual(["ancient"])
    expect(visitEra(["ancient"], "modern")).toEqual(["ancient", "modern"])
    const tally = recordAnswer({ correct: 1, answered: 2 }, true)
    expect(noteOpeningBest({ ...tally, best: 1 }, 2).best).toBe(2)
  })
})
