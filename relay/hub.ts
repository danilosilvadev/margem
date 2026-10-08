import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomBytes } from "node:crypto"
import { WebSocket, WebSocketServer } from "ws"
import { bytesToHex } from "@noble/hashes/utils.js"
import { keygenAsync } from "@noble/ed25519"
import { KIND, shapeError, signEvent, verifyEvent, type BlocklistBody, type SignedEvent } from "../shared/events.ts"
import { matchesFilter, type EventFilter } from "../shared/filter.ts"
import { EventStore } from "./store.ts"

type ClientMsg =
  | { op: "hello"; pubkey: string }
  | { op: "subscribe"; sub: string; filter: EventFilter }
  | { op: "close"; sub: string }
  | { op: "event"; event: SignedEvent }
  | { op: "signal"; to: string; data: unknown }

type SocketState = {
  ws: WebSocket
  pubkey: string
  subs: Map<string, EventFilter>
  events: number[]
  signals: number[]
}

export type RelayHandle = {
  url: string
  adminUrl: string
  ownerPubkey: string
  adminToken: string
  dataDir: string
  close: () => Promise<void>
}

const HEX_64 = /^[0-9a-f]{64}$/

async function loadOwner(dataDir: string): Promise<{ publicKey: string; secretKey: string }> {
  const file = path.join(dataDir, "owner.json")
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as { publicKey: string; secretKey: string }
    if (HEX_64.test(parsed.publicKey) && HEX_64.test(parsed.secretKey)) return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }
  const keys = await keygenAsync()
  const owner = { publicKey: bytesToHex(keys.publicKey), secretKey: bytesToHex(keys.secretKey) }
  await writeFile(file, JSON.stringify(owner, null, 2), { encoding: "utf8", mode: 0o600 })
  return owner
}

async function loadToken(dataDir: string): Promise<string> {
  const file = path.join(dataDir, "admin.token")
  try {
    const token = (await readFile(file, "utf8")).trim()
    if (token) return token
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }
  const token = randomBytes(24).toString("hex")
  await writeFile(file, `${token}\n`, { encoding: "utf8", mode: 0o600 })
  return token
}

function listen(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (address && typeof address === "object") resolve(address.port)
      else reject(new Error("Could not bind a port"))
    })
  })
}

export async function startRelay(opts?: {
  port?: number
  adminPort?: number
  host?: string
  dataDir?: string
}): Promise<RelayHandle> {
  const dataDir = opts?.dataDir ?? path.join(process.cwd(), "relay-data")
  const host = opts?.host ?? "127.0.0.1"
  await mkdir(dataDir, { recursive: true })
  const owner = await loadOwner(dataDir)
  const adminToken = await loadToken(dataDir)
  const store = new EventStore(dataDir)
  await store.load()

  const sockets = new Set<SocketState>()
  const wss = new WebSocketServer({ host, port: opts?.port ?? 0 })
  const wsPort = await new Promise<number>((resolve, reject) => {
    wss.once("error", reject)
    wss.once("listening", () => {
      const address = wss.address()
      if (address && typeof address === "object") resolve(address.port)
      else reject(new Error("WebSocket port missing"))
    })
  })

  function send(socket: WebSocket, message: unknown) {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
  }

  function peersFor(self: SocketState): string[] {
    const books = new Set(
      [...self.subs.values()].map((filter) => filter.book).filter((book): book is string => Boolean(book)),
    )
    if (books.size === 0) return []
    const peers = new Set<string>()
    for (const other of sockets) {
      if (other === self || !other.pubkey) continue
      const shares = [...other.subs.values()].some((filter) => filter.book && books.has(filter.book))
      if (shares) peers.add(other.pubkey)
    }
    return [...peers]
  }

  function pushPeers() {
    for (const socket of sockets) send(socket.ws, { op: "peers", peers: peersFor(socket) })
  }

  function deliver(event: SignedEvent) {
    for (const socket of sockets) {
      for (const [sub, filter] of socket.subs) {
        if (!matchesFilter(event, filter)) continue
        if (store.blocked(event, owner.publicKey)) continue
        send(socket.ws, { op: "event", sub, event })
      }
    }
  }

  async function publishBlocklist(body: BlocklistBody): Promise<SignedEvent> {
    const event = await signEvent(
      {
        pubkey: owner.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: KIND.blocklist,
        tags: [["d", "blocklist"]],
        content: JSON.stringify({
          blockedPubkeys: body.blockedPubkeys,
          blockedEventIds: body.blockedEventIds,
          note: body.note ?? "",
        }),
      },
      owner.secretKey,
    )
    await store.add(event)
    deliver(event)
    return event
  }

  wss.on("connection", (ws) => {
    const state: SocketState = { ws, pubkey: "", subs: new Map(), events: [], signals: [] }
    sockets.add(state)
    ws.on("message", async (data) => {
      let msg: ClientMsg
      try {
        msg = JSON.parse(data.toString()) as ClientMsg
      } catch {
        send(ws, { op: "notice", message: "Message was not JSON" })
        return
      }
      if (msg.op === "hello") {
        if (!HEX_64.test(msg.pubkey ?? "")) {
          send(ws, { op: "notice", message: "Hello needs a public key" })
          return
        }
        state.pubkey = msg.pubkey
        send(ws, { op: "hello", owner: owner.publicKey })
        return
      }
      if (!state.pubkey) {
        send(ws, { op: "notice", message: "Say hello first" })
        return
      }
      if (msg.op === "subscribe") {
        if (!msg.sub || typeof msg.sub !== "string" || msg.sub.length > 64 || !msg.filter) return
        state.subs.set(msg.sub, msg.filter)
        for (const event of store.query(msg.filter)) {
          if (store.blocked(event, owner.publicKey)) continue
          send(ws, { op: "event", sub: msg.sub, event })
        }
        send(ws, { op: "eose", sub: msg.sub })
        pushPeers()
        return
      }
      if (msg.op === "close") {
        state.subs.delete(msg.sub)
        pushPeers()
        return
      }
      if (msg.op === "signal") {
        const now = Date.now()
        state.signals = state.signals.filter((at) => now - at < 60_000)
        if (state.signals.length > 120) return
        state.signals.push(now)
        if (!HEX_64.test(msg.to ?? "")) return
        for (const other of sockets) {
          if (other.pubkey === msg.to) send(other.ws, { op: "signal", from: state.pubkey, data: msg.data })
        }
        return
      }
      if (msg.op === "event") {
        const event = msg.event
        const now = Date.now()
        state.events = state.events.filter((at) => now - at < 60_000)
        if (state.events.length > 40) {
          send(ws, { op: "ok", id: event?.id ?? "", accepted: false, reason: "Slow down a moment" })
          return
        }
        state.events.push(now)
        if (!event || event.pubkey !== state.pubkey) {
          send(ws, { op: "ok", id: event?.id ?? "", accepted: false, reason: "Event key does not match this connection" })
          return
        }
        const problem = shapeError(event)
        if (problem) {
          send(ws, { op: "ok", id: event.id ?? "", accepted: false, reason: problem })
          return
        }
        if (!(await verifyEvent(event))) {
          send(ws, { op: "ok", id: event.id, accepted: false, reason: "Signature did not verify" })
          return
        }
        if (event.kind === KIND.blocklist && event.pubkey !== owner.publicKey) {
          send(ws, { op: "ok", id: event.id, accepted: false, reason: "Only the relay owner can publish a blocklist" })
          return
        }
        if (event.kind === KIND.blocklist) {
          const body = JSON.parse(event.content) as BlocklistBody
          if (!Array.isArray(body.blockedPubkeys) || !Array.isArray(body.blockedEventIds)) {
            send(ws, { op: "ok", id: event.id, accepted: false, reason: "Blocklist body is invalid" })
            return
          }
        }
        if (store.blocked(event, owner.publicKey)) {
          send(ws, { op: "ok", id: event.id, accepted: false, reason: "Blocked by the moderator list" })
          return
        }
        await store.add(event)
        send(ws, { op: "ok", id: event.id, accepted: true })
        deliver(event)
      }
    })
    ws.on("close", () => {
      sockets.delete(state)
      pushPeers()
    })
  })

  const ping = setInterval(() => {
    for (const socket of sockets) {
      if (socket.ws.readyState === WebSocket.OPEN) socket.ws.ping()
    }
  }, 30_000)

  const admin = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const remote = req.socket.remoteAddress ?? ""
    if (remote !== "127.0.0.1" && remote !== "::1" && remote !== "::ffff:127.0.0.1") {
      res.writeHead(403)
      res.end("Admin listens on localhost only")
      return
    }
    const auth = req.headers.authorization ?? ""
    if (auth !== `Bearer ${adminToken}`) {
      res.writeHead(401)
      res.end("Admin token required")
      return
    }
    const url = new URL(req.url ?? "/", "http://127.0.0.1")
    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ ok: true, owner: owner.publicKey, events: store.all().length }))
      return
    }
    if (req.method === "GET" && url.pathname === "/blocklist") {
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify(store.blocklist(owner.publicKey)))
      return
    }
    if (req.method === "POST" && url.pathname === "/blocklist") {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(chunk as Buffer)
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as BlocklistBody
        if (!Array.isArray(body.blockedPubkeys) || !Array.isArray(body.blockedEventIds)) throw new Error("lists")
        const event = await publishBlocklist(body)
        res.writeHead(200, { "content-type": "application/json" })
        res.end(JSON.stringify({ ok: true, id: event.id }))
      } catch {
        res.writeHead(400)
        res.end("Expected blockedPubkeys and blockedEventIds arrays")
      }
      return
    }
    res.writeHead(404)
    res.end("Not found")
  })
  const adminPort = opts?.adminPort && opts.adminPort !== 0 ? opts.adminPort : await listen(admin)
  if (opts?.adminPort && opts.adminPort !== 0) {
    await new Promise<void>((resolve, reject) => {
      admin.once("error", reject)
      admin.listen(opts.adminPort, "127.0.0.1", () => resolve())
    })
  }

  return {
    url: `ws://${host}:${wsPort}`,
    adminUrl: `http://127.0.0.1:${adminPort}`,
    ownerPubkey: owner.publicKey,
    adminToken,
    dataDir,
    close: async () => {
      clearInterval(ping)
      for (const socket of sockets) socket.ws.close()
      await new Promise<void>((resolve) => wss.close(() => resolve()))
      await new Promise<void>((resolve) => admin.close(() => resolve()))
    },
  }
}
