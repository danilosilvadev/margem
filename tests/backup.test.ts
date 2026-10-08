import { describe, expect, it } from "vitest"
import { buildBackup, buildIdentityFile, parseTransfer, shouldPromptBackup, type BackupPrefs } from "../shared/backup.ts"
import { createIdentity } from "../shared/identity.ts"
import { KIND, signEvent } from "../shared/events.ts"
import type { Settings } from "../shared/types.ts"

const day = 86_400_000
const settings: Settings = {
  theme: "light",
  fontSize: 19,
  relayUrl: "ws://127.0.0.1:41732",
  columns: 3,
  columnLangs: ["en", "pt", "es"],
  mobileMode: "stack",
  focusLang: "en",
}

function prefs(patch: Partial<BackupPrefs> = {}): BackupPrefs {
  return {
    frequency: "daily",
    lastBackupAt: null,
    lastBackupRevision: 0,
    lastDismissedAt: null,
    dataRevision: 0,
    ...patch,
  }
}

describe("backup reminders", () => {
  it("stays quiet until there is something unsaved", () => {
    expect(shouldPromptBackup(prefs(), 1_000)).toBe(false)
    expect(shouldPromptBackup(prefs({ dataRevision: 2, lastBackupRevision: 2 }), 1_000)).toBe(false)
  })

  it("asks once there are changes, then waits after Later or a backup", () => {
    const now = 100 * day
    expect(shouldPromptBackup(prefs({ dataRevision: 1 }), now)).toBe(true)
    expect(shouldPromptBackup(prefs({ dataRevision: 1, lastDismissedAt: now - day + 1 }), now)).toBe(false)
    expect(shouldPromptBackup(prefs({ dataRevision: 1, lastDismissedAt: now - day }), now)).toBe(true)
    expect(shouldPromptBackup(prefs({ dataRevision: 4, lastBackupRevision: 3, lastBackupAt: now - 1_000 }), now)).toBe(false)
    expect(shouldPromptBackup(prefs({ dataRevision: 4, lastBackupRevision: 3, lastBackupAt: now - day }), now)).toBe(true)
  })

  it("respects a longer interval and an off switch", () => {
    const now = 50 * day
    expect(shouldPromptBackup(prefs({ frequency: "off", dataRevision: 3 }), now)).toBe(false)
    expect(shouldPromptBackup(prefs({ frequency: "weekly", dataRevision: 2, lastBackupAt: now - 3 * day }), now)).toBe(false)
    expect(shouldPromptBackup(prefs({ frequency: "weekly", dataRevision: 2, lastBackupAt: now - 7 * day }), now)).toBe(true)
    expect(shouldPromptBackup(prefs({ frequency: "3d", dataRevision: 2, lastDismissedAt: now - 3 * day }), now)).toBe(true)
  })
})

describe("backup files", () => {
  it("round-trips a backup and an identity file", async () => {
    const identity = await createIdentity()
    identity.displayName = "Nise"
    const note = await signEvent(
      {
        pubkey: identity.publicKey,
        created_at: 50,
        kind: KIND.comment,
        tags: [["b", "the-raven"], ["c", "poem"]],
        content: "Keep this.",
      },
      identity.secretKey,
    )
    const doc = buildBackup({
      exportedAt: "2026-10-08T12:00:00.000Z",
      identity,
      settings,
      backup: { frequency: "weekly" },
      shelf: [{ bookId: "the-raven", addedAt: 1 }],
      progress: [{ bookId: "the-raven", chapterId: "poem", paragraphId: "s03", updatedAt: 2 }],
      bookmarks: [{ id: "m1", bookId: "the-raven", chapterId: "poem", paragraphId: "s03", createdAt: 3 }],
      highlights: [{ id: "h1", bookId: "the-raven", chapterId: "poem", paragraphId: "s03", lang: "en", quote: "Nevermore", createdAt: 4 }],
      events: [note],
    })
    const parsed = await parseTransfer(JSON.parse(JSON.stringify(doc)))
    expect(parsed.kind).toBe("backup")
    if (parsed.kind !== "backup") return
    expect(parsed.doc.identity.publicKey).toBe(identity.publicKey)
    expect(parsed.doc.events).toHaveLength(1)
    expect(parsed.doc.highlights[0]?.quote).toBe("Nevermore")
    expect(parsed.droppedEvents).toBe(0)

    const idFile = buildIdentityFile(identity, doc.exportedAt)
    const idParsed = await parseTransfer(idFile)
    expect(idParsed.kind).toBe("identity")
  })

  it("drops an event whose signature does not verify", async () => {
    const identity = await createIdentity()
    const doc = buildBackup({
      exportedAt: "2026-10-08T12:00:00.000Z",
      identity,
      settings,
      backup: { frequency: "daily" },
      shelf: [],
      progress: [],
      bookmarks: [],
      highlights: [],
      events: [
        {
          id: "ab".repeat(32),
          pubkey: identity.publicKey,
          created_at: 1,
          kind: 1,
          tags: [],
          content: "forged",
          sig: "cd".repeat(64),
        },
      ],
    })
    const parsed = await parseTransfer(doc)
    if (parsed.kind !== "backup") throw new Error("expected backup")
    expect(parsed.doc.events).toHaveLength(0)
    expect(parsed.droppedEvents).toBe(1)
  })

  it("rejects a file that is not a Margem backup", async () => {
    await expect(parseTransfer({ hello: true })).rejects.toThrow(/not a Margem backup/)
  })
})
