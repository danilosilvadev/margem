import type { SignedEvent } from "@shared/events"
import type { EventFilter } from "@shared/filter"
import { DirectMesh } from "./direct"

export type RelayStatus = "offline" | "connecting" | "open"

type Handlers = {
  onStatus: (status: RelayStatus) => void
  onOwner: (pubkey: string) => void
  onPeers: (peers: string[]) => void
  onDirect: (count: number) => void
  onEvent: (event: SignedEvent, via: "relay" | "direct") => void
  onEose: (sub: string) => void
  onOk: (id: string, accepted: boolean, reason?: string) => void
  onOpen: () => void
}

export class RelayClient {
  private ws: WebSocket | null = null
  private url = ""
  private pubkey = ""
  private subs = new Map<string, EventFilter>()
  private attempt = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private stopped = false
  private mesh: DirectMesh | null = null
  status: RelayStatus = "offline"
  private handlers: Handlers

  constructor(handlers: Handlers) {
    this.handlers = handlers
  }

  connect(url: string, pubkey: string, stunUrl: string | null) {
    this.url = url
    this.pubkey = pubkey
    this.stopped = false
    this.mesh?.close()
    this.mesh = new DirectMesh(
      pubkey,
      (to, data) => this.send({ op: "signal", to, data }),
      (event) => this.handlers.onEvent(event, "direct"),
      (count) => this.handlers.onDirect(count),
      stunUrl,
    )
    this.open()
  }

  private setStatus(status: RelayStatus) {
    this.status = status
    this.handlers.onStatus(status)
  }

  private send(message: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message))
  }

  private open() {
    if (this.stopped || !this.url || !this.pubkey) return
    this.setStatus("connecting")
    let socket: WebSocket
    try {
      socket = new WebSocket(this.url)
    } catch {
      this.schedule()
      return
    }
    this.ws = socket
    socket.addEventListener("open", () => {
      if (this.ws !== socket) return
      this.attempt = 0
      this.send({ op: "hello", pubkey: this.pubkey })
    })
    socket.addEventListener("message", (event) => {
      if (this.ws !== socket) return
      this.receive(String(event.data))
    })
    socket.addEventListener("close", () => {
      if (this.ws !== socket) return
      this.ws = null
      this.setStatus("offline")
      this.schedule()
    })
    socket.addEventListener("error", () => {
      socket.close()
    })
  }

  private schedule() {
    if (this.stopped) return
    const delay = Math.min(15_000, 400 * 2 ** this.attempt)
    this.attempt += 1
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => this.open(), delay)
  }

  private receive(raw: string) {
    let message: {
      op: string
      owner?: string
      sub?: string
      event?: SignedEvent
      peers?: string[]
      from?: string
      data?: unknown
      id?: string
      accepted?: boolean
      reason?: string
    }
    try {
      message = JSON.parse(raw)
    } catch {
      return
    }
    if (message.op === "hello" && message.owner) {
      this.setStatus("open")
      this.handlers.onOwner(message.owner)
      for (const [sub, filter] of this.subs) this.send({ op: "subscribe", sub, filter })
      this.handlers.onOpen()
      return
    }
    if (message.op === "event" && message.event) {
      this.handlers.onEvent(message.event, "relay")
      return
    }
    if (message.op === "eose" && message.sub) {
      this.handlers.onEose(message.sub)
      return
    }
    if (message.op === "peers" && message.peers) {
      this.handlers.onPeers(message.peers)
      this.mesh?.setPeers(message.peers)
      return
    }
    if (message.op === "signal" && message.from) {
      void this.mesh?.handleSignal(message.from, message.data)
      return
    }
    if (message.op === "ok" && message.id) {
      this.handlers.onOk(message.id, Boolean(message.accepted), message.reason)
    }
  }

  subscribe(sub: string, filter: EventFilter) {
    this.subs.set(sub, filter)
    if (this.status === "open") this.send({ op: "subscribe", sub, filter })
  }

  unsubscribe(sub: string) {
    this.subs.delete(sub)
    if (this.status === "open") this.send({ op: "close", sub })
  }

  publish(event: SignedEvent) {
    this.send({ op: "event", event })
    this.mesh?.broadcast(event)
  }

  close() {
    this.stopped = true
    if (this.timer) clearTimeout(this.timer)
    this.mesh?.close()
    this.ws?.close()
    this.ws = null
    this.setStatus("offline")
  }
}
