import { readFile } from "node:fs/promises"
import { gzipSync } from "node:zlib"
import { describe, expect, it } from "vitest"
import { assertBook } from "../shared/books.ts"
import { splitHighlight } from "../shared/highlight.ts"
import { createIdentity } from "../shared/identity.ts"
import { KIND, signEvent } from "../shared/events.ts"

describe("the sample book", () => {
  it("aligns eighteen public-domain stanzas", async () => {
    const book = assertBook(JSON.parse(await readFile("content/the-raven/book.json", "utf8")))
    expect(book.chapters[0]?.paragraphs).toHaveLength(18)
    const first = book.chapters[0]?.paragraphs[0]
    expect(first?.en).toContain("midnight dreary")
    expect(first?.pt).toContain("meia-noite")
    expect(first?.es).toContain("media noche")
    expect(book.chapters[0]?.paragraphs[7]?.en).toContain("Nevermore")
    expect(book.chapters[0]?.paragraphs[7]?.pt).toContain("Nunca mais")
    expect(book.chapters[0]?.paragraphs[7]?.es).toContain("Nunca más")
  })
})

describe("highlights", () => {
  it("wraps a quote inside a stanza", () => {
    const runs = splitHighlight("Quoth the raven, Nevermore.", ["Nevermore"])
    expect(runs.filter((run) => run.hit).map((run) => run.text)).toEqual(["Nevermore"])
  })
})

describe("comment size", () => {
  it("keeps a typical signed comment under 1 KB of JSON", async () => {
    const identity = await createIdentity()
    const event = await signEvent(
      {
        pubkey: identity.publicKey,
        created_at: 1_700_000_000,
        kind: KIND.comment,
        tags: [
          ["b", "the-raven"],
          ["c", "poem"],
          ["p", "s01"],
        ],
        content: "A margin note of about two hundred characters, which is a comfortable length for a remark on one stanza rather than an essay. The signature travels with it.",
      },
      identity.secretKey,
    )
    const bytes = Buffer.byteLength(JSON.stringify(event))
    expect(bytes).toBeLessThan(1024)
    expect(gzipSync(JSON.stringify(event)).length).toBeLessThan(bytes)
  })
})
