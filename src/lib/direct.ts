import type { SignedEvent } from "@shared/events"

type Signal =
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit }

type Link = {
  pc: RTCPeerConnection
  dc: RTCDataChannel | null
  iceQueue: RTCIceCandidateInit[]
}

export class DirectMesh {
  private links = new Map<string, Link>()
  private onCount: (count: number) => void
  private localPubkey: string
  private sendSignal: (to: string, data: Signal) => void
  private onEvent: (event: SignedEvent) => void
  private stunUrl: string | null

  constructor(
    localPubkey: string,
    sendSignal: (to: string, data: Signal) => void,
    onEvent: (event: SignedEvent) => void,
    onCount: (count: number) => void,
    stunUrl: string | null,
  ) {
    this.localPubkey = localPubkey
    this.sendSignal = sendSignal
    this.onEvent = onEvent
    this.onCount = onCount
    this.stunUrl = stunUrl
  }

  private config(): RTCConfiguration {
    if (!this.stunUrl) return { iceServers: [] }
    return { iceServers: [{ urls: this.stunUrl }] }
  }

  private emitCount() {
    let open = 0
    for (const link of this.links.values()) {
      if (link.dc?.readyState === "open") open += 1
    }
    this.onCount(open)
  }

  setPeers(peers: string[]) {
    if (typeof RTCPeerConnection === "undefined") return
    const want = new Set(peers.filter((pubkey) => pubkey && pubkey !== this.localPubkey))
    for (const pubkey of this.links.keys()) {
      if (!want.has(pubkey)) this.drop(pubkey)
    }
    for (const pubkey of want) {
      if (!this.links.has(pubkey)) void this.ensure(pubkey)
    }
  }

  private drop(pubkey: string) {
    const link = this.links.get(pubkey)
    if (!link) return
    link.dc?.close()
    link.pc.close()
    this.links.delete(pubkey)
    this.emitCount()
  }

  private bindChannel(pubkey: string, channel: RTCDataChannel) {
    const link = this.links.get(pubkey)
    if (!link) return
    link.dc = channel
    channel.onopen = () => this.emitCount()
    channel.onclose = () => this.emitCount()
    channel.onmessage = (event) => {
      try {
        const body = JSON.parse(String(event.data)) as { event?: SignedEvent }
        if (body.event) this.onEvent(body.event)
      } catch {
        /* ignore a bad frame */
      }
    }
  }

  private async ensure(pubkey: string) {
    if (this.links.has(pubkey) || typeof RTCPeerConnection === "undefined") return
    const pc = new RTCPeerConnection(this.config())
    const link: Link = { pc, dc: null, iceQueue: [] }
    this.links.set(pubkey, link)
    const initiator = this.localPubkey < pubkey
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(pubkey, { type: "ice", candidate: event.candidate.toJSON() })
      }
    }
    pc.ondatachannel = (event) => this.bindChannel(pubkey, event.channel)
    if (initiator) {
      const channel = pc.createDataChannel("events")
      this.bindChannel(pubkey, channel)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      if (pc.localDescription) this.sendSignal(pubkey, { type: "offer", sdp: pc.localDescription })
    }
  }

  async handleSignal(from: string, data: unknown) {
    if (typeof RTCPeerConnection === "undefined") return
    if (!data || typeof data !== "object") return
    const signal = data as Signal
    if (!this.links.has(from)) await this.ensure(from)
    const link = this.links.get(from)
    if (!link) return
    if (signal.type === "offer" && signal.sdp) {
      await link.pc.setRemoteDescription(signal.sdp)
      const answer = await link.pc.createAnswer()
      await link.pc.setLocalDescription(answer)
      if (link.pc.localDescription) this.sendSignal(from, { type: "answer", sdp: link.pc.localDescription })
      await this.flushIce(link)
    } else if (signal.type === "answer" && signal.sdp) {
      await link.pc.setRemoteDescription(signal.sdp)
      await this.flushIce(link)
    } else if (signal.type === "ice" && signal.candidate) {
      if (!link.pc.remoteDescription) link.iceQueue.push(signal.candidate)
      else await link.pc.addIceCandidate(signal.candidate)
    }
  }

  private async flushIce(link: Link) {
    const queued = link.iceQueue.splice(0)
    for (const candidate of queued) {
      try {
        await link.pc.addIceCandidate(candidate)
      } catch {
        /* a stale candidate can be ignored */
      }
    }
  }

  broadcast(event: SignedEvent) {
    const payload = JSON.stringify({ event })
    for (const link of this.links.values()) {
      if (link.dc?.readyState === "open") link.dc.send(payload)
    }
  }

  close() {
    for (const pubkey of [...this.links.keys()]) this.drop(pubkey)
  }
}
