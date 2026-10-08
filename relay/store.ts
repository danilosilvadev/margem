import { appendFile, mkdir, readFile } from "node:fs/promises"
import path from "node:path"
import { KIND, parseBlocklist, verifyEvent, type BlocklistBody, type SignedEvent } from "../shared/events.ts"
import { matchesFilter, type EventFilter } from "../shared/filter.ts"

export class EventStore {
  private events: SignedEvent[] = []
  private ids = new Set<string>()
  private file: string
  private dataDir: string

  constructor(dataDir: string) {
    this.dataDir = dataDir
    this.file = path.join(dataDir, "events.jsonl")
  }

  async load(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true })
    let raw = ""
    try {
      raw = await readFile(this.file, "utf8")
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue
      try {
        const event = JSON.parse(line) as SignedEvent
        if (!(await verifyEvent(event))) continue
        if (this.ids.has(event.id)) continue
        this.ids.add(event.id)
        this.events.push(event)
      } catch {
        /* skip a damaged line */
      }
    }
  }

  has(id: string): boolean {
    return this.ids.has(id)
  }

  all(): SignedEvent[] {
    return this.events
  }

  query(filter: EventFilter): SignedEvent[] {
    return this.events.filter((event) => matchesFilter(event, filter))
  }

  blocklist(ownerPubkey: string): BlocklistBody {
    const lists = this.events
      .filter((event) => event.kind === KIND.blocklist && event.pubkey === ownerPubkey)
      .sort((a, b) => a.created_at - b.created_at || a.id.localeCompare(b.id))
    const latest = lists.at(-1)
    return latest ? (parseBlocklist(latest) ?? { blockedPubkeys: [], blockedEventIds: [] }) : { blockedPubkeys: [], blockedEventIds: [] }
  }

  blocked(event: SignedEvent, ownerPubkey: string): boolean {
    if (event.kind === KIND.blocklist) return false
    const list = this.blocklist(ownerPubkey)
    return list.blockedPubkeys.includes(event.pubkey) || list.blockedEventIds.includes(event.id)
  }

  async add(event: SignedEvent): Promise<void> {
    if (this.ids.has(event.id)) return
    this.ids.add(event.id)
    this.events.push(event)
    await appendFile(this.file, `${JSON.stringify(event)}\n`, "utf8")
  }
}
