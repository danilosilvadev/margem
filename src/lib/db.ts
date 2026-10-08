import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import { tagValue, type SignedEvent } from "@shared/events"
import type { BackupState, Bookmark, Book, Highlight, Progress, Settings, ShelfItem } from "@shared/types"
import type { Identity } from "@shared/identity"
import { brand } from "@shared/brand"

type StoredEvent = SignedEvent & {
  bookId: string
  chapterId: string
  chapterKey: string
  pending: boolean
  via: "local" | "relay" | "direct"
}

interface MargemSchema extends DBSchema {
  meta: { key: string; value: Identity | Settings | BackupState | string | CatalogCache }
  books: { key: string; value: Book }
  progress: { key: string; value: Progress }
  bookmarks: { key: string; value: Bookmark; indexes: { bookId: string } }
  highlights: { key: string; value: Highlight; indexes: { bookId: string } }
  events: { key: string; value: StoredEvent; indexes: { chapter: string } }
  shelf: { key: string; value: ShelfItem }
}

type CatalogCache = { fetchedAt: number; body: string }

const DEFAULT_SETTINGS = (): Settings => ({
  theme: "light",
  fontSize: 19,
  relayUrl: import.meta.env.VITE_RELAY_URL || "ws://127.0.0.1:41732",
  columns: 3,
  columnLangs: ["en", "pt", "es"],
  mobileMode: "stack",
  focusLang: "en",
})

export const DEFAULT_BACKUP: BackupState = {
  frequency: "daily",
  lastBackupAt: null,
  lastBackupRevision: 0,
  lastDismissedAt: null,
  dataRevision: 0,
}

let dbName = databaseName()
let dbPromise: Promise<IDBPDatabase<MargemSchema>> | null = null

function databaseName(): string {
  if (typeof sessionStorage === "undefined") return "margem"
  const params = new URLSearchParams(location.search)
  const requested = params.get("as")
  if (requested) sessionStorage.setItem("margem-as", requested)
  const profile = (sessionStorage.getItem("margem-as") || "default").toLowerCase().replace(/[^a-z0-9-]/g, "")
  return profile && profile !== "default" ? `margem-${profile}` : "margem"
}

export function profileLabel(): string {
  if (typeof sessionStorage === "undefined") return "default"
  return sessionStorage.getItem("margem-as") || "default"
}

export function setDbName(name: string) {
  dbName = name
  dbPromise = null
}

export async function closeDb() {
  if (!dbPromise) return
  const db = await dbPromise
  db.close()
  dbPromise = null
}

export async function resetDatabase() {
  await closeDb()
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

function open(): Promise<IDBPDatabase<MargemSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<MargemSchema>(dbName, 1, {
      upgrade(db) {
        db.createObjectStore("meta")
        db.createObjectStore("books", { keyPath: "id" })
        db.createObjectStore("progress", { keyPath: "bookId" })
        const bookmarks = db.createObjectStore("bookmarks", { keyPath: "id" })
        bookmarks.createIndex("bookId", "bookId")
        const highlights = db.createObjectStore("highlights", { keyPath: "id" })
        highlights.createIndex("bookId", "bookId")
        const events = db.createObjectStore("events", { keyPath: "id" })
        events.createIndex("chapter", "chapterKey")
        db.createObjectStore("shelf", { keyPath: "bookId" })
      },
    })
  }
  return dbPromise
}

async function bump(db: IDBPDatabase<MargemSchema>) {
  const tx = db.transaction("meta", "readwrite")
  const current = ((await tx.store.get("backup")) as BackupState | undefined) ?? { ...DEFAULT_BACKUP }
  current.dataRevision += 1
  await tx.store.put(current, "backup")
  await tx.done
}

export async function getOrCreateIdentity(create: () => Promise<Identity>): Promise<Identity> {
  const db = await open()
  const existing = (await db.get("meta", "identity")) as Identity | undefined
  if (existing) return existing
  const created = await create()
  const tx = db.transaction("meta", "readwrite")
  const again = (await tx.store.get("identity")) as Identity | undefined
  if (again) {
    await tx.done
    return again
  }
  await tx.store.put(created, "identity")
  await tx.done
  return created
}

export async function saveIdentity(identity: Identity) {
  const db = await open()
  await db.put("meta", identity, "identity")
  await bump(db)
}

export async function getSettings(): Promise<Settings> {
  const db = await open()
  return ((await db.get("meta", "settings")) as Settings | undefined) ?? DEFAULT_SETTINGS()
}

export async function saveSettings(settings: Settings) {
  const db = await open()
  await db.put("meta", settings, "settings")
  await bump(db)
}

export async function getBackupState(): Promise<BackupState> {
  const db = await open()
  return ((await db.get("meta", "backup")) as BackupState | undefined) ?? { ...DEFAULT_BACKUP }
}

export async function saveBackupState(state: BackupState) {
  const db = await open()
  await db.put("meta", state, "backup")
}

export async function getShelf(): Promise<ShelfItem[]> {
  const db = await open()
  return db.getAll("shelf")
}

export async function setShelf(bookId: string, on: boolean) {
  const db = await open()
  if (on) await db.put("shelf", { bookId, addedAt: Date.now() })
  else await db.delete("shelf", bookId)
  await bump(db)
}

export async function saveProgress(progress: Progress): Promise<boolean> {
  const db = await open()
  const prev = await db.get("progress", progress.bookId)
  await db.put("progress", progress)
  const changed = !prev || prev.paragraphId !== progress.paragraphId || prev.chapterId !== progress.chapterId
  if (changed) await bump(db)
  return changed
}

export async function getProgress(bookId: string): Promise<Progress | undefined> {
  const db = await open()
  return db.get("progress", bookId)
}

export async function allProgress(): Promise<Progress[]> {
  const db = await open()
  return db.getAll("progress")
}

export async function bookmarksFor(bookId: string): Promise<Bookmark[]> {
  const db = await open()
  return db.getAllFromIndex("bookmarks", "bookId", bookId)
}

export async function allBookmarks(): Promise<Bookmark[]> {
  const db = await open()
  return db.getAll("bookmarks")
}

export async function toggleBookmark(bookmark: Omit<Bookmark, "createdAt">): Promise<boolean> {
  const db = await open()
  const existing = await db.get("bookmarks", bookmark.id)
  if (existing) await db.delete("bookmarks", bookmark.id)
  else await db.put("bookmarks", { ...bookmark, createdAt: Date.now() })
  await bump(db)
  return !existing
}

export async function highlightsFor(bookId: string): Promise<Highlight[]> {
  const db = await open()
  return db.getAllFromIndex("highlights", "bookId", bookId)
}

export async function allHighlights(): Promise<Highlight[]> {
  const db = await open()
  return db.getAll("highlights")
}

export async function addHighlight(highlight: Highlight) {
  const db = await open()
  await db.put("highlights", highlight)
  await bump(db)
}

export async function deleteHighlight(id: string) {
  const db = await open()
  await db.delete("highlights", id)
  await bump(db)
}

export async function putStoredEvent(
  event: SignedEvent,
  extra: { pending: boolean; via: StoredEvent["via"] },
): Promise<"new" | "updated" | "same"> {
  const db = await open()
  const existing = await db.get("events", event.id)
  if (existing && !existing.pending) {
    if (extra.via === "direct" && existing.via !== "direct") {
      existing.via = "direct"
      await db.put("events", existing)
      return "updated"
    }
    return "same"
  }
  const bookId = tagValue(event, "b") ?? ""
  const chapterId = tagValue(event, "c") ?? ""
  const via =
    extra.via === "direct" || existing?.via === "direct"
      ? "direct"
      : existing?.via && existing.via !== "local"
        ? existing.via
        : extra.via
  const stored: StoredEvent = {
    ...event,
    bookId,
    chapterId,
    chapterKey: `${bookId}/${chapterId}`,
    pending: extra.pending,
    via,
  }
  await db.put("events", stored)
  if (!existing) {
    if (event.kind === 1 || event.kind === 5 || event.kind === 30010 || event.kind === 30011 || event.kind === 30012 || event.kind === 30013) await bump(db)
    return "new"
  }
  return "updated"
}

export async function eventsForChapter(bookId: string, chapterId: string): Promise<StoredEvent[]> {
  const db = await open()
  const indexed = await db.getAllFromIndex("events", "chapter", `${bookId}/${chapterId}`)
  const global = (await db.getAll("events")).filter((event) => event.kind === 0 || event.kind === 30001)
  const map = new Map<string, StoredEvent>()
  for (const event of [...indexed, ...global]) map.set(event.id, event)
  return [...map.values()]
}

export async function allEvents(): Promise<StoredEvent[]> {
  const db = await open()
  return db.getAll("events")
}

export async function pendingEvents(): Promise<StoredEvent[]> {
  const db = await open()
  return (await db.getAll("events")).filter((event) => event.pending)
}

export async function markEventSynced(id: string) {
  const db = await open()
  const existing = await db.get("events", id)
  if (!existing || !existing.pending) return
  existing.pending = false
  if (existing.via === "local") existing.via = "relay"
  await db.put("events", existing)
}

export async function cacheBook(book: Book) {
  const db = await open()
  await db.put("books", book)
}

export async function cachedBook(id: string): Promise<Book | undefined> {
  const db = await open()
  return db.get("books", id)
}

export async function cacheCatalog(body: string) {
  const db = await open()
  const entry: CatalogCache = { fetchedAt: Date.now(), body }
  await db.put("meta", entry, "catalog")
}

export async function cachedCatalog(): Promise<string | undefined> {
  const db = await open()
  const entry = (await db.get("meta", "catalog")) as CatalogCache | undefined
  return entry?.body
}

export async function replaceFromBackup(input: {
  identity: Identity
  settings: Settings
  frequency: BackupState["frequency"]
  shelf: ShelfItem[]
  progress: Progress[]
  bookmarks: Bookmark[]
  highlights: Highlight[]
  events: SignedEvent[]
  exportedAt: string
}) {
  const db = await open()
  const tx = db.transaction(["meta", "shelf", "progress", "bookmarks", "highlights", "events"], "readwrite")
  await tx.objectStore("meta").put(input.identity, "identity")
  await tx.objectStore("meta").put(input.settings, "settings")
  for (const store of ["shelf", "progress", "bookmarks", "highlights", "events"] as const) {
    await tx.objectStore(store).clear()
  }
  for (const item of input.shelf) await tx.objectStore("shelf").put(item)
  for (const item of input.progress) await tx.objectStore("progress").put(item)
  for (const item of input.bookmarks) await tx.objectStore("bookmarks").put(item)
  for (const item of input.highlights) await tx.objectStore("highlights").put(item)
  for (const event of input.events) {
    const bookId = tagValue(event, "b") ?? ""
    const chapterId = tagValue(event, "c") ?? ""
    const stored: StoredEvent = {
      ...event,
      bookId,
      chapterId,
      chapterKey: `${bookId}/${chapterId}`,
      pending: false,
      via: "local",
    }
    await tx.objectStore("events").put(stored)
  }
  const exported = Date.parse(input.exportedAt)
  const state: BackupState = {
    frequency: input.frequency,
    lastBackupAt: Number.isNaN(exported) ? Date.now() : exported,
    lastBackupRevision: 0,
    lastDismissedAt: null,
    dataRevision: 0,
  }
  await tx.objectStore("meta").put(state, "backup")
  await tx.done
}

export async function snapshotForBackup() {
  const db = await open()
  const [identity, settings, backup, shelf, progress, bookmarks, highlights, events] = await Promise.all([
    db.get("meta", "identity") as Promise<Identity>,
    getSettings(),
    getBackupState(),
    db.getAll("shelf"),
    db.getAll("progress"),
    db.getAll("bookmarks"),
    db.getAll("highlights"),
    db.getAll("events"),
  ])
  return { identity, settings, backup, shelf, progress, bookmarks, highlights, events }
}

export const appName = brand.name

export type { StoredEvent }
