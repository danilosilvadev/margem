import { identityFromMnemonic, mnemonicIsValid, type Identity } from "./identity.ts"
import type { BackupState, Bookmark, Highlight, Progress, ReminderFrequency, Settings, ShelfItem } from "./types.ts"
import { verifyEvent, type SignedEvent } from "./events.ts"

export type BackupPrefs = BackupState

const DAY_MS = 86_400_000

export function reminderIntervalMs(frequency: ReminderFrequency): number | null {
  if (frequency === "off") return null
  if (frequency === "daily") return DAY_MS
  if (frequency === "3d") return 3 * DAY_MS
  return 7 * DAY_MS
}

/**
 * Prompt only when the reader has changes newer than the last backup,
 * and only once per reminder interval. Never on the first visit
 * (no backup and no earlier dismissal). Never writes a file by itself.
 */
export function shouldPromptBackup(prefs: BackupPrefs, now: number): boolean {
  const interval = reminderIntervalMs(prefs.frequency)
  if (interval === null) return false
  if (prefs.dataRevision <= prefs.lastBackupRevision) return false
  const anchor = Math.max(prefs.lastBackupAt ?? 0, prefs.lastDismissedAt ?? 0)
  if (anchor === 0) return false
  return now - anchor >= interval
}

export type BackupDocument = {
  app: "margem"
  format: "backup"
  version: 1
  exportedAt: string
  identity: Identity
  settings: Settings
  backup: Pick<BackupState, "frequency">
  shelf: ShelfItem[]
  progress: Progress[]
  bookmarks: Bookmark[]
  highlights: Highlight[]
  events: SignedEvent[]
}

export type IdentityDocument = {
  app: "margem"
  format: "identity"
  version: 1
  exportedAt: string
  identity: Identity
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asIdentity(value: unknown): Identity {
  if (!isObject(value)) throw new Error("Backup is missing the reading key")
  const { publicKey, secretKey, mnemonic, displayName, createdAt } = value
  if (typeof publicKey !== "string" || typeof secretKey !== "string" || typeof mnemonic !== "string") {
    throw new Error("Backup reading key is incomplete")
  }
  if (!mnemonicIsValid(mnemonic)) throw new Error("Backup recovery phrase is not valid")
  if (typeof displayName !== "string" || typeof createdAt !== "number") {
    throw new Error("Backup reading key is incomplete")
  }
  return { publicKey, secretKey, mnemonic, displayName, createdAt }
}

export async function assertIdentityMatches(identity: Identity): Promise<void> {
  const derived = await identityFromMnemonic(identity.mnemonic, identity.displayName, identity.createdAt)
  if (derived.publicKey !== identity.publicKey || derived.secretKey !== identity.secretKey) {
    throw new Error("The recovery phrase does not match the key in this file")
  }
}

export function buildBackup(input: Omit<BackupDocument, "app" | "format" | "version">): BackupDocument {
  return { app: "margem", format: "backup", version: 1, ...input }
}

export function buildIdentityFile(identity: Identity, exportedAt: string): IdentityDocument {
  return { app: "margem", format: "identity", version: 1, exportedAt, identity }
}

export async function parseTransfer(raw: unknown): Promise<
  | { kind: "backup"; doc: BackupDocument; droppedEvents: number }
  | { kind: "identity"; doc: IdentityDocument }
> {
  if (!isObject(raw) || raw.app !== "margem" || raw.version !== 1) {
    throw new Error("This file is not a Margem backup")
  }
  if (raw.format === "identity") {
    const identity = asIdentity(raw.identity)
    await assertIdentityMatches(identity)
    if (typeof raw.exportedAt !== "string") throw new Error("Identity file has no export time")
    return { kind: "identity", doc: { app: "margem", format: "identity", version: 1, exportedAt: raw.exportedAt, identity } }
  }
  if (raw.format !== "backup") throw new Error("This file is not a Margem backup")
  const identity = asIdentity(raw.identity)
  await assertIdentityMatches(identity)
  if (!isObject(raw.settings) || !isObject(raw.backup)) throw new Error("Backup settings are missing")
  const frequency = raw.backup.frequency
  if (frequency !== "daily" && frequency !== "3d" && frequency !== "weekly" && frequency !== "off") {
    throw new Error("Backup reminder setting is not recognized")
  }
  const eventsIn = Array.isArray(raw.events) ? raw.events : null
  const shelf = Array.isArray(raw.shelf) ? raw.shelf : null
  const progress = Array.isArray(raw.progress) ? raw.progress : null
  const bookmarks = Array.isArray(raw.bookmarks) ? raw.bookmarks : null
  const highlights = Array.isArray(raw.highlights) ? raw.highlights : null
  if (!eventsIn || !shelf || !progress || !bookmarks || !highlights || typeof raw.exportedAt !== "string") {
    throw new Error("Backup is missing reading data")
  }
  const events: SignedEvent[] = []
  let droppedEvents = 0
  for (const item of eventsIn) {
    if (!isObject(item)) {
      droppedEvents += 1
      continue
    }
    const event = item as SignedEvent
    if (await verifyEvent(event)) events.push(event)
    else droppedEvents += 1
  }
  return {
    kind: "backup",
    droppedEvents,
    doc: {
      app: "margem",
      format: "backup",
      version: 1,
      exportedAt: raw.exportedAt,
      identity,
      settings: raw.settings as Settings,
      backup: { frequency },
      shelf: shelf as ShelfItem[],
      progress: progress as Progress[],
      bookmarks: bookmarks as Bookmark[],
      highlights: highlights as Highlight[],
      events,
    },
  }
}
