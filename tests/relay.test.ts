import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { createIdentity } from "../shared/identity.ts"
import { KIND, signEvent, verifyEvent } from "../shared/events.ts"
import { visibleComments } from "../shared/merge.ts"
import { startRelay, type RelayHandle } from "../relay/hub.ts"
import { RelayClient } from "../src/lib/relay-client.ts"
import type { SignedEvent } from "../shared/events.ts"

const relays: RelayHandle[] = []

afterEach(async () => {
  while (relays.length) {
    const relay = relays.pop()
    if (relay) await relay.close()
  }
})

function waitFor(check: () => boolean, label: string, ms = 8000) {
  const start = Date.now()
  return new Promise<void>((resolve, reject) => {
    const timer = setInterval(() => {
      if (check()) {
        clearInterval(timer)
        resolve()
      } else if (Date.now() - start > ms) {
        clearInterval(timer)
        reject(new Error(`timed out waiting for ${label}`))
      }
    }, 25)
  })
}

describe("relay", () => {
  it("delivers a signed comment between two readers and forwards a direct-link signal", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "margem-relay-"))
    const relay = await startRelay({ port: 0, adminPort: 0, dataDir: dir })
    relays.push(relay)
    const ada = await createIdentity()
    const bo = await createIdentity()
    const seen: SignedEvent[] = []
    const signals: unknown[] = []
    let boOpen = false
    const boClient = new RelayClient({
      onStatus: (status) => {
        boOpen = status === "open"
      },
      onOwner: () => undefined,
      onPeers: () => undefined,
      onDirect: () => undefined,
      onEvent: (event) => {
        seen.push(event)
      },
      onEose: () => undefined,
      onOk: () => undefined,
      onOpen: () => undefined,
    })
    const adaClient = new RelayClient({
      onStatus: () => undefined,
      onOwner: () => undefined,
      onPeers: () => undefined,
      onDirect: () => undefined,
      onEvent: () => undefined,
      onEose: () => undefined,
      onOk: () => undefined,
      onOpen: () => undefined,
    })
    adaClient.connect(relay.url, ada.publicKey, null)
    boClient.connect(relay.url, bo.publicKey, null)
    await waitFor(() => boOpen, "bo connected")
    adaClient.subscribe("chapter", { kinds: [KIND.comment, KIND.delete], book: "the-raven", chapter: "poem" })
    boClient.subscribe("chapter", { kinds: [KIND.comment, KIND.delete], book: "the-raven", chapter: "poem" })

    const note = await signEvent(
      {
        pubkey: ada.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: KIND.comment,
        tags: [
          ["b", "the-raven"],
          ["c", "poem"],
          ["p", "s01"],
        ],
        content: "Lenore, in the margin.",
      },
      ada.secretKey,
    )
    adaClient.publish(note)
    await waitFor(() => seen.some((event) => event.id === note.id), "comment arrived")
    expect(await verifyEvent(seen.find((event) => event.id === note.id)!)).toBe(true)

    const raw = new WebSocket(relay.url)
    const forwarded: { from?: string; data?: { hello?: string } }[] = []
    await new Promise<void>((resolve, reject) => {
      raw.addEventListener("open", () => resolve())
      raw.addEventListener("error", () => reject(new Error("signal socket failed")))
    })
    raw.send(JSON.stringify({ op: "hello", pubkey: bo.publicKey }))
    await new Promise((resolve) => setTimeout(resolve, 50))
    raw.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as { op: string; from?: string; data?: { hello?: string } }
      if (message.op === "signal") forwarded.push(message)
    })
    const sender = new WebSocket(relay.url)
    await new Promise<void>((resolve) => sender.addEventListener("open", () => resolve()))
    sender.send(JSON.stringify({ op: "hello", pubkey: ada.publicKey }))
    await new Promise((resolve) => setTimeout(resolve, 50))
    sender.send(JSON.stringify({ op: "signal", to: bo.publicKey, data: { hello: "offer" } }))
    await waitFor(() => forwarded.some((message) => message.data?.hello === "offer"), "signal forwarded")
    expect(forwarded[0]?.from).toBe(ada.publicKey)
    raw.close()
    sender.close()
    adaClient.close()
    boClient.close()
    signals.push(forwarded[0])
    expect(signals).toHaveLength(1)
    await rm(dir, { recursive: true, force: true })
  })

  it("rejects a bad signature and a blocked author", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "margem-relay-"))
    const relay = await startRelay({ port: 0, adminPort: 0, dataDir: dir })
    relays.push(relay)
    const ada = await createIdentity()
    const bo = await createIdentity()
    const oks: { id: string; accepted: boolean; reason?: string }[] = []
    const incoming: SignedEvent[] = []
    let open = false
    const client = new RelayClient({
      onStatus: (status) => {
        open = status === "open"
      },
      onOwner: () => undefined,
      onPeers: () => undefined,
      onDirect: () => undefined,
      onEvent: (event) => incoming.push(event),
      onEose: () => undefined,
      onOk: (id, accepted, reason) => oks.push({ id, accepted, reason }),
      onOpen: () => undefined,
    })
    client.connect(relay.url, ada.publicKey, null)
    await waitFor(() => open, "connected")
    client.subscribe("policy", { kinds: [KIND.blocklist] })
    client.subscribe("chapter", { kinds: [KIND.comment], book: "the-raven", chapter: "poem" })
    const note = await signEvent(
      {
        pubkey: ada.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: KIND.comment,
        tags: [["b", "the-raven"], ["c", "poem"]],
        content: "Before the list.",
      },
      ada.secretKey,
    )
    client.publish({ ...note, sig: "aa".repeat(64) })
    await waitFor(() => oks.some((item) => item.accepted === false), "bad signature rejected")

    client.publish(note)
    await waitFor(() => incoming.some((event) => event.id === note.id), "stored comment echoed")

    const blocked = await fetch(`${relay.adminUrl}/blocklist`, {
      method: "POST",
      headers: { authorization: `Bearer ${relay.adminToken}`, "content-type": "application/json" },
      body: JSON.stringify({ blockedPubkeys: [ada.publicKey], blockedEventIds: [] }),
    })
    expect(blocked.ok).toBe(true)
    await waitFor(() => incoming.some((event) => event.kind === KIND.blocklist), "blocklist delivered")
    const later = await signEvent(
      {
        pubkey: ada.publicKey,
        created_at: Math.floor(Date.now() / 1000) + 1,
        kind: KIND.comment,
        tags: [["b", "the-raven"], ["c", "poem"]],
        content: "After the list.",
      },
      ada.secretKey,
    )
    const before = oks.length
    client.publish(later)
    await waitFor(() => oks.length > before, "blocked publish answered")
    expect(oks.at(-1)?.accepted).toBe(false)
    const owner = relay.ownerPubkey
    expect(visibleComments(incoming, owner).some((event) => event.id === note.id)).toBe(false)
    expect(bo.publicKey).not.toBe(ada.publicKey)
    client.close()
    await rm(dir, { recursive: true, force: true })
  })

  it("accepts a letter from a one-time key and refuses a comment from that key", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "margem-relay-"))
    const relay = await startRelay({ port: 0, adminPort: 0, dataDir: dir })
    relays.push(relay)
    const reader = await createIdentity()
    const ghost = await createIdentity()
    const oks: { id: string; accepted: boolean; reason?: string }[] = []
    let open = false
    const client = new RelayClient({
      onStatus: (status) => {
        open = status === "open"
      },
      onOwner: () => undefined,
      onPeers: () => undefined,
      onDirect: () => undefined,
      onEvent: () => undefined,
      onEose: () => undefined,
      onOk: (id, accepted, reason) => oks.push({ id, accepted, reason }),
      onOpen: () => undefined,
    })
    client.connect(relay.url, reader.publicKey, null)
    await waitFor(() => open, "reader connected")
    const letter = await signEvent(
      {
        pubkey: ghost.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: KIND.letter,
        tags: [],
        content: JSON.stringify({ body: "Left on the table." }),
      },
      ghost.secretKey,
    )
    const comment = await signEvent(
      {
        pubkey: ghost.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: KIND.comment,
        tags: [["b", "the-raven"], ["c", "poem"]],
        content: "Not from this connection.",
      },
      ghost.secretKey,
    )
    client.publish(letter)
    client.publish(comment)
    await waitFor(() => oks.length >= 2, "both answers")
    expect(oks.find((item) => item.id === letter.id)?.accepted).toBe(true)
    expect(oks.find((item) => item.id === comment.id)?.accepted).toBe(false)
    client.close()
    await rm(dir, { recursive: true, force: true })
  })
})
