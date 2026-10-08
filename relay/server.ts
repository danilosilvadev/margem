import { startRelay } from "./hub.ts"

const port = Number(process.env.RELAY_PORT ?? 41732)
const adminPort = Number(process.env.RELAY_ADMIN_PORT ?? 41733)
const host = process.env.RELAY_HOST ?? "0.0.0.0"

const relay = await startRelay({ port, adminPort, host })
console.log(`Margem relay listening on ${relay.url}`)
console.log(`Admin on ${relay.adminUrl} (localhost only)`)
console.log(`Moderator public key: ${relay.ownerPubkey}`)
console.log(`Admin token file: ${relay.dataDir}/admin.token`)
console.log("Leave this process running. It is the seed readers sync with when nobody else is online.")
