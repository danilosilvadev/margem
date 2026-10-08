import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { createIdentity, identityFromMnemonic, type Identity } from "@shared/identity"
import { KIND, signEvent, tagValue, verifyEvent, type SignedEvent } from "@shared/events"
import { displayNames, visibleComments } from "@shared/merge"
import { buildBackup, buildIdentityFile, parseTransfer, shouldPromptBackup } from "@shared/backup"
import type { BackupState, ReminderFrequency, Settings } from "@shared/types"
import { brand } from "@shared/brand"
import {
  eventsForChapter,
  getBackupState,
  getOrCreateIdentity,
  getSettings,
  markEventSynced,
  pendingEvents,
  profileLabel,
  putStoredEvent,
  saveBackupState,
  saveIdentity,
  saveSettings,
  setShelf,
  snapshotForBackup,
  type StoredEvent,
} from "@/lib/db"
import { saveTextFile } from "@/lib/files"
import { RelayClient, type RelayStatus } from "@/lib/relay-client"

type TransferResult = Awaited<ReturnType<typeof parseTransfer>>

type AppValue = {
  ready: boolean
  identity: Identity
  settings: Settings
  backup: BackupState
  promptBackup: boolean
  syncStatus: RelayStatus
  directPeers: number
  peerCount: number
  ownerPubkey: string
  profile: string
  persisted: boolean | null
  estimate: { usage?: number; quota?: number } | null
  tick: number
  notice: string | null
  clearNotice: () => void
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  setFrequency: (frequency: ReminderFrequency) => Promise<void>
  setDisplayName: (name: string) => Promise<void>
  replaceIdentity: (phrase: string) => Promise<void>
  dismissBackup: () => Promise<void>
  exportBackup: () => Promise<"shared" | "downloaded" | "cancelled">
  exportIdentity: () => Promise<"shared" | "downloaded" | "cancelled">
  importTransfer: (raw: unknown) => Promise<TransferResult>
  toggleOnShelf: (bookId: string, on: boolean) => Promise<void>
  watchChapter: (bookId: string, chapterId: string) => () => void
  publishComment: (input: {
    bookId: string
    chapterId: string
    paragraphId?: string
    content: string
    replyTo?: string
  }) => Promise<void>
  deleteComment: (target: SignedEvent) => Promise<void>
  publishCommunity: (input: { kind: number; tags: string[][]; content: string; anonymous?: boolean }) => Promise<void>
  refresh: () => void
}

const Ctx = createContext<AppValue | null>(null)

function strip(event: StoredEvent): SignedEvent {
  return {
    id: event.id,
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
    sig: event.sig,
  }
}

const stun = import.meta.env.VITE_STUN_URL ?? "stun:stun.l.google.com:19302"

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [backup, setBackup] = useState<BackupState | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [syncStatus, setSyncStatus] = useState<RelayStatus>("offline")
  const [directPeers, setDirectPeers] = useState(0)
  const [peerCount, setPeerCount] = useState(0)
  const [ownerPubkey, setOwnerPubkey] = useState("")
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [estimate, setEstimate] = useState<{ usage?: number; quota?: number } | null>(null)
  const [tick, setTick] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const clientRef = useRef<RelayClient | null>(null)
  const chapterRef = useRef<{ bookId: string; chapterId: string } | null>(null)

  useEffect(() => {
    let cancel = false
    void (async () => {
      const nextIdentity = await getOrCreateIdentity(createIdentity)
      const [nextSettings, nextBackup] = await Promise.all([getSettings(), getBackupState()])
      if (cancel) return
      setIdentity(nextIdentity)
      setSettings(nextSettings)
      setBackup(nextBackup)
      setReady(true)
    })()
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    if (!settings) return
    document.documentElement.dataset.theme = settings.theme
    const themeColor = settings.theme === "dark" ? "#1c1412" : settings.theme === "sepia" ? "#ead7b8" : "#4d1925"
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor)
  }, [settings])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    const onVisible = () => setNow(Date.now())
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  useEffect(() => {
    if (!ready || !navigator.storage?.persist) return
    void navigator.storage.persisted().then(async (already) => {
      setPersisted(already || (await navigator.storage.persist()))
    })
  }, [ready])

  useEffect(() => {
    if (!ready || !navigator.storage?.estimate) return
    void navigator.storage.estimate().then((value) => setEstimate({ usage: value.usage, quota: value.quota }))
  }, [ready, tick])

  useEffect(() => {
    if (!ready || !identity || !settings) return
    const client = new RelayClient({
      onStatus: setSyncStatus,
      onOwner: setOwnerPubkey,
      onPeers: (peers) => setPeerCount(peers.length),
      onDirect: setDirectPeers,
      onEvent: (event, via) => {
        void verifyEvent(event).then(async (ok) => {
          if (!ok) return
          const result = await putStoredEvent(event, { pending: false, via })
          if (result !== "same") setTick((value) => value + 1)
        })
      },
      onEose: () => setTick((value) => value + 1),
      onOk: (id, accepted, reason) => {
        if (!accepted) {
          setNotice(reason ?? "The relay did not keep that comment")
          return
        }
        void markEventSynced(id).then(() => setTick((value) => value + 1))
      },
      onOpen: () => {
        void pendingEvents().then((events) => {
          for (const event of events) client.publish(strip(event))
        })
        const chapter = chapterRef.current
        if (chapter) {
          client.subscribe("chapter", {
            kinds: [KIND.comment, KIND.delete],
            book: chapter.bookId,
            chapter: chapter.chapterId,
          })
        }
        client.subscribe("community", {
          kinds: [KIND.readingRoom, KIND.salonPost, KIND.marginalia, KIND.letter],
        })
      },
    })
    clientRef.current = client
    client.connect(settings.relayUrl, identity.publicKey, stun || null)
    client.subscribe("policy", { kinds: [KIND.blocklist] })
    client.subscribe("profiles", { kinds: [KIND.profile] })
    client.subscribe("community", {
      kinds: [KIND.readingRoom, KIND.salonPost, KIND.marginalia, KIND.letter],
    })
    return () => {
      client.close()
      clientRef.current = null
    }
  }, [ready, identity?.publicKey, settings?.relayUrl])

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const current = await getSettings()
    const next = { ...current, ...patch }
    await saveSettings(next)
    setSettings(next)
    setBackup(await getBackupState())
  }, [])

  const setFrequency = useCallback(async (frequency: ReminderFrequency) => {
    const state = await getBackupState()
    const next = { ...state, frequency, dataRevision: state.dataRevision + (frequency === state.frequency ? 0 : 1) }
    await saveBackupState(next)
    setBackup(next)
  }, [])

  const publishSigned = useCallback(async (event: SignedEvent) => {
    await putStoredEvent(event, { pending: true, via: "local" })
    clientRef.current?.publish(event)
    setTick((value) => value + 1)
    setBackup(await getBackupState())
  }, [])

  const setDisplayName = useCallback(
    async (name: string) => {
      if (!identity) return
      const trimmed = name.trim().replace(/\s+/g, " ").slice(0, 40)
      const next = { ...identity, displayName: trimmed }
      await saveIdentity(next)
      setIdentity(next)
      const event = await signEvent(
        {
          pubkey: next.publicKey,
          created_at: Math.floor(Date.now() / 1000),
          kind: KIND.profile,
          tags: [],
          content: JSON.stringify({ name: trimmed }),
        },
        next.secretKey,
      )
      await publishSigned(event)
    },
    [identity, publishSigned],
  )

  const replaceIdentity = useCallback(async (phrase: string) => {
    const next = await identityFromMnemonic(phrase)
    const current = await getSettings()
    next.displayName = ""
    await saveIdentity(next)
    setIdentity(next)
    if (current) setBackup(await getBackupState())
  }, [])

  const dismissBackup = useCallback(async () => {
    const state = await getBackupState()
    const next = { ...state, lastDismissedAt: Date.now() }
    await saveBackupState(next)
    setBackup(next)
  }, [])

  const exportBackup = useCallback(async () => {
    const snap = await snapshotForBackup()
    const doc = buildBackup({
      exportedAt: new Date().toISOString(),
      identity: snap.identity,
      settings: snap.settings,
      backup: { frequency: snap.backup.frequency },
      shelf: snap.shelf,
      progress: snap.progress,
      bookmarks: snap.bookmarks,
      highlights: snap.highlights,
      events: snap.events.map(strip),
    })
    const result = await saveTextFile(
      `${brand.name.toLowerCase()}-backup-${doc.exportedAt.slice(0, 10)}.json`,
      JSON.stringify(doc, null, 2),
    )
    if (result === "cancelled") return result
    const state = await getBackupState()
    const next = { ...state, lastBackupAt: Date.now(), lastBackupRevision: state.dataRevision, lastDismissedAt: null }
    await saveBackupState(next)
    setBackup(next)
    return result
  }, [])

  const exportIdentity = useCallback(async () => {
    if (!identity) return "cancelled" as const
    const doc = buildIdentityFile(identity, new Date().toISOString())
    return saveTextFile(`${brand.name.toLowerCase()}-identity.json`, JSON.stringify(doc, null, 2))
  }, [identity])

  const importTransfer = useCallback(async (raw: unknown) => parseTransfer(raw), [])

  const toggleOnShelf = useCallback(async (bookId: string, on: boolean) => {
    await setShelf(bookId, on)
    setBackup(await getBackupState())
    setTick((value) => value + 1)
  }, [])

  const watchChapter = useCallback((bookId: string, chapterId: string) => {
    chapterRef.current = { bookId, chapterId }
    clientRef.current?.subscribe("chapter", { kinds: [KIND.comment, KIND.delete], book: bookId, chapter: chapterId })
    return () => {
      if (chapterRef.current?.bookId === bookId && chapterRef.current.chapterId === chapterId) {
        chapterRef.current = null
        clientRef.current?.unsubscribe("chapter")
      }
    }
  }, [])

  const publishComment = useCallback(
    async (input: { bookId: string; chapterId: string; paragraphId?: string; content: string; replyTo?: string }) => {
      if (!identity) return
      const tags = [
        ["b", input.bookId],
        ["c", input.chapterId],
      ]
      if (input.paragraphId) tags.push(["p", input.paragraphId])
      if (input.replyTo) tags.push(["e", input.replyTo])
      const event = await signEvent(
        {
          pubkey: identity.publicKey,
          created_at: Math.floor(Date.now() / 1000),
          kind: KIND.comment,
          tags,
          content: input.content.trim(),
        },
        identity.secretKey,
      )
      await publishSigned(event)
    },
    [identity, publishSigned],
  )

  const publishCommunity = useCallback(
    async (input: { kind: number; tags: string[][]; content: string; anonymous?: boolean }) => {
      const who = input.anonymous ? await createIdentity() : identity
      if (!who) return
      const event = await signEvent(
        {
          pubkey: who.publicKey,
          created_at: Math.floor(Date.now() / 1000),
          kind: input.kind,
          tags: input.tags,
          content: input.content,
        },
        who.secretKey,
      )
      await publishSigned(event)
    },
    [identity, publishSigned],
  )

  const deleteComment = useCallback(
    async (target: SignedEvent) => {
      if (!identity || target.pubkey !== identity.publicKey) return
      const event = await signEvent(
        {
          pubkey: identity.publicKey,
          created_at: Math.floor(Date.now() / 1000),
          kind: KIND.delete,
          tags: [
            ["e", target.id],
            ["b", tagValue(target, "b") ?? ""],
            ["c", tagValue(target, "c") ?? ""],
          ],
          content: "",
        },
        identity.secretKey,
      )
      await publishSigned(event)
    },
    [identity, publishSigned],
  )

  const promptBackup = backup ? shouldPromptBackup(backup, now) : false

  const value = useMemo<AppValue | null>(() => {
    if (!ready || !identity || !settings || !backup) return null
    return {
      ready,
      identity,
      settings,
      backup,
      promptBackup,
      syncStatus,
      directPeers,
      peerCount,
      ownerPubkey,
      profile: profileLabel(),
      persisted,
      estimate,
      tick,
      notice,
      clearNotice: () => setNotice(null),
      updateSettings,
      setFrequency,
      setDisplayName,
      replaceIdentity,
      dismissBackup,
      exportBackup,
      exportIdentity,
      importTransfer,
      toggleOnShelf,
      watchChapter,
      publishComment,
      deleteComment,
      publishCommunity,
      refresh,
    }
  }, [
    ready,
    identity,
    settings,
    backup,
    promptBackup,
    syncStatus,
    directPeers,
    peerCount,
    ownerPubkey,
    persisted,
    estimate,
      tick,
      notice,
      updateSettings,
    setFrequency,
    setDisplayName,
    replaceIdentity,
    dismissBackup,
    exportBackup,
    exportIdentity,
    importTransfer,
    toggleOnShelf,
    watchChapter,
    publishComment,
    deleteComment,
    publishCommunity,
    refresh,
  ])

  if (!value) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <p className="font-serif text-2xl">{brand.name}</p>
      </div>
    )
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppValue {
  const value = useContext(Ctx)
  if (!value) throw new Error("useApp outside provider")
  return value
}

export function useChapterThread(bookId: string, chapterId: string) {
  const { tick, ownerPubkey } = useApp()
  const [events, setEvents] = useState<StoredEvent[]>([])
  useEffect(() => {
    let cancel = false
    void eventsForChapter(bookId, chapterId).then((rows) => {
      if (!cancel) setEvents(rows)
    })
    return () => {
      cancel = true
    }
  }, [bookId, chapterId, tick])
  const comments = useMemo(
    () => visibleComments(events, ownerPubkey) as StoredEvent[],
    [events, ownerPubkey],
  )
  const names = useMemo(() => displayNames(events, ownerPubkey), [events, ownerPubkey])
  return { events, comments, names }
}
