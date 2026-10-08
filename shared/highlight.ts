export type TextRun = { text: string; hit: boolean }

/** Wrap exact quote matches. Overlaps collapse into one highlighted run. */
export function splitHighlight(text: string, quotes: string[]): TextRun[] {
  const ranges: [number, number][] = []
  for (const quote of quotes) {
    if (!quote) continue
    let from = 0
    while (from < text.length) {
      const index = text.indexOf(quote, from)
      if (index < 0) break
      ranges.push([index, index + quote.length])
      from = index + quote.length
    }
  }
  ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1])
  const merged: [number, number][] = []
  for (const range of ranges) {
    const last = merged.at(-1)
    if (!last || range[0] > last[1]) merged.push([range[0], range[1]])
    else last[1] = Math.max(last[1], range[1])
  }
  const runs: TextRun[] = []
  let cursor = 0
  for (const [start, end] of merged) {
    if (start > cursor) runs.push({ text: text.slice(cursor, start), hit: false })
    runs.push({ text: text.slice(start, end), hit: true })
    cursor = end
  }
  if (cursor < text.length || runs.length === 0) runs.push({ text: text.slice(cursor), hit: false })
  return runs
}
