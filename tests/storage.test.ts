import { beforeEach, describe, expect, it } from "vitest"
import { createIdentity } from "../shared/identity.ts"
import { KIND, signEvent } from "../shared/events.ts"
import { buildBackup } from "../shared/backup.ts"
import {
  addHighlight,
  allBookmarks,
  closeDb,
  getBackupState,
  getOrCreateIdentity,
  getProgress,
  highlightsFor,
  replaceFromBackup,
  resetDatabase,
  saveProgress,
  setDbName,
  toggleBookmark,
} from "../src/lib/db.ts"
import type { Settings } from "../shared/types.ts"

const settings: Settings = {
  theme: "sepia",
  fontSize: 21,
  relayUrl: "ws://127.0.0.1:41732",
  columns: 2,
  columnLangs: ["pt", "en", "es"],
  mobileMode: "focus",
  focusLang: "pt",
}

beforeEach(async () => {
  await closeDb()
  setDbName(`test-${crypto.randomUUID()}`)
  await resetDatabase()
})

describe("local storage", () => {
  it("stores place, bookmarks, and highlights", async () => {
    const identity = await getOrCreateIdentity(createIdentity)
    const again = await getOrCreateIdentity(createIdentity)
    expect(again.publicKey).toBe(identity.publicKey)

    expect(await saveProgress({ bookId: "the-raven", chapterId: "poem", paragraphId: "s02", updatedAt: 10 })).toBe(true)
    expect(await saveProgress({ bookId: "the-raven", chapterId: "poem", paragraphId: "s02", updatedAt: 11 })).toBe(false)
    expect((await getProgress("the-raven"))?.paragraphId).toBe("s02")

    expect(await toggleBookmark({ id: "b1", bookId: "the-raven", chapterId: "poem", paragraphId: "s02" })).toBe(true)
    expect(await toggleBookmark({ id: "b1", bookId: "the-raven", chapterId: "poem", paragraphId: "s02" })).toBe(false)
    expect(await allBookmarks()).toHaveLength(0)
    await toggleBookmark({ id: "b1", bookId: "the-raven", chapterId: "poem", paragraphId: "s02" })

    await addHighlight({
      id: "h1",
      bookId: "the-raven",
      chapterId: "poem",
      paragraphId: "s02",
      lang: "pt",
      quote: "Nunca mais",
      createdAt: 12,
    })
    expect((await highlightsFor("the-raven"))[0]?.quote).toBe("Nunca mais")
    const backup = await getBackupState()
    expect(backup.dataRevision).toBeGreaterThan(0)
  })

  it("restores a backup over the device copy", async () => {
    await getOrCreateIdentity(createIdentity)
    await saveProgress({ bookId: "the-raven", chapterId: "poem", paragraphId: "s01", updatedAt: 1 })
    const incoming = await createIdentity()
    incoming.displayName = "Restored"
    const note = await signEvent(
      {
        pubkey: incoming.publicKey,
        created_at: 80,
        kind: KIND.comment,
        tags: [["b", "the-raven"], ["c", "poem"], ["p", "s08"]],
        content: "From the other device.",
      },
      incoming.secretKey,
    )
    const doc = buildBackup({
      exportedAt: "2026-10-01T00:00:00.000Z",
      identity: incoming,
      settings,
      backup: { frequency: "weekly" },
      shelf: [{ bookId: "the-raven", addedAt: 5 }],
      progress: [{ bookId: "the-raven", chapterId: "poem", paragraphId: "s08", updatedAt: 6 }],
      bookmarks: [],
      highlights: [],
      events: [note],
    })
    await replaceFromBackup({
      identity: doc.identity,
      settings: doc.settings,
      frequency: doc.backup.frequency,
      shelf: doc.shelf,
      progress: doc.progress,
      bookmarks: doc.bookmarks,
      highlights: doc.highlights,
      events: doc.events,
      exportedAt: doc.exportedAt,
    })
    expect((await getOrCreateIdentity(createIdentity)).publicKey).toBe(incoming.publicKey)
    expect((await getProgress("the-raven"))?.paragraphId).toBe("s08")
    const state = await getBackupState()
    expect(state.frequency).toBe("weekly")
    expect(state.dataRevision).toBe(0)
    expect(state.lastBackupRevision).toBe(0)
  })
})
