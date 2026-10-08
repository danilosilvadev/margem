type Listener = (online: boolean) => void

let online = typeof navigator === "undefined" ? true : navigator.onLine
const listeners = new Set<Listener>()

export function isReachable() {
  return online
}

export function subscribeReachability(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setOnline(next: boolean) {
  if (next === online) return
  online = next
  for (const listener of listeners) listener(online)
}

export function noteNetworkSuccess() {
  setOnline(true)
}

export function noteNetworkFailure() {
  setOnline(false)
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => setOnline(true))
  window.addEventListener("offline", () => setOnline(false))
}

/**
 * `/__reachability` is not precached. A CacheFirst worker can still answer
 * `/books/` while the network is blocked, and Chromium can leave
 * `navigator.onLine` true in that case. A failed request here means the
 * origin itself did not answer.
 */
export async function probeReachability(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    noteNetworkFailure()
    return false
  }
  try {
    await fetch("/__reachability", { cache: "no-store" })
    noteNetworkSuccess()
    return true
  } catch {
    noteNetworkFailure()
    return false
  }
}
