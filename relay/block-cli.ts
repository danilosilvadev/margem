import { readFile } from "node:fs/promises"
import path from "node:path"

const dataDir = process.env.RELAY_DATA ?? path.join(process.cwd(), "relay-data")
const adminUrl = process.env.RELAY_ADMIN_URL ?? "http://127.0.0.1:41733"
const [action, value] = process.argv.slice(2)

if (!action || !["show", "add-pubkey", "remove-pubkey", "add-event", "remove-event"].includes(action)) {
  console.error("Usage: tsx relay/block-cli.ts show | add-pubkey <hex> | remove-pubkey <hex> | add-event <id> | remove-event <id>")
  process.exit(1)
}

const token = (await readFile(path.join(dataDir, "admin.token"), "utf8")).trim()
const currentRes = await fetch(`${adminUrl}/blocklist`, { headers: { authorization: `Bearer ${token}` } })
if (!currentRes.ok) {
  console.error(`Relay admin did not answer (${currentRes.status}). Start it with npm run relay.`)
  process.exit(1)
}
const list = (await currentRes.json()) as { blockedPubkeys: string[]; blockedEventIds: string[]; note?: string }
if (action === "show") {
  console.log(JSON.stringify(list, null, 2))
  process.exit(0)
}
if (!value) {
  console.error("Missing value")
  process.exit(1)
}
const pubkeys = new Set(list.blockedPubkeys)
const ids = new Set(list.blockedEventIds)
if (action === "add-pubkey") pubkeys.add(value)
if (action === "remove-pubkey") pubkeys.delete(value)
if (action === "add-event") ids.add(value)
if (action === "remove-event") ids.delete(value)
const res = await fetch(`${adminUrl}/blocklist`, {
  method: "POST",
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  body: JSON.stringify({ blockedPubkeys: [...pubkeys], blockedEventIds: [...ids], note: list.note ?? "" }),
})
if (!res.ok) {
  console.error(await res.text())
  process.exit(1)
}
console.log("Blocklist updated", await res.json())
