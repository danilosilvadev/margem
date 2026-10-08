import { describe, expect, it } from "vitest"
import { WORKS } from "../shared/canon.ts"
import { bookProfile } from "../shared/book-profile.ts"
import { joinPublic } from "../src/lib/public-url.ts"

describe("book profiles", () => {
  it("gives every work a context, themes, people, and a sourced line", () => {
    for (const work of WORKS) {
      const profile = bookProfile(work.id)
      expect(profile, work.id).toBeTruthy()
      expect(profile?.context.length).toBeGreaterThan(40)
      expect(profile?.themes.length).toBeGreaterThan(0)
      expect(profile?.characters.length).toBeGreaterThan(0)
      expect(profile?.quotes.length).toBeGreaterThan(0)
      expect(profile?.quotes[0]?.cite.length).toBeGreaterThan(0)
    }
  })
})

describe("public urls", () => {
  it("prefixes catalog and book files with the site base", () => {
    expect(joinPublic("/", "/catalog.json")).toBe("/catalog.json")
    expect(joinPublic("/margem/", "/books/the-raven.json")).toBe("/margem/books/the-raven.json")
    expect(joinPublic("/margem", "books/the-raven.json")).toBe("/margem/books/the-raven.json")
  })
})
