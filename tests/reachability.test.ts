import { describe, expect, it } from "vitest"
import { isReachable, noteNetworkFailure, noteNetworkSuccess, subscribeReachability } from "../src/lib/reachability.ts"

describe("reachability", () => {
  it("flips when a probe notes success or failure", () => {
    noteNetworkSuccess()
    expect(isReachable()).toBe(true)
    const seen: boolean[] = []
    const stop = subscribeReachability((online) => seen.push(online))
    noteNetworkFailure()
    expect(isReachable()).toBe(false)
    noteNetworkFailure()
    noteNetworkSuccess()
    expect(isReachable()).toBe(true)
    expect(seen).toEqual([false, true])
    stop()
  })
})