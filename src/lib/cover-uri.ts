const PALETTE = [
  { bg: "#7E1F2E", ink: "#E0C078" },
  { bg: "#1F4D3F", ink: "#E8C76A" },
  { bg: "#1B3A6B", ink: "#D9C28A" },
  { bg: "#5A2348", ink: "#D9B26A" },
  { bg: "#2A2A2A", ink: "#C9B27C" },
  { bg: "#286A78", ink: "#E8D6A8" },
]

function hash(id: string): number {
  let n = 0
  for (const char of id) n = (n * 33 + char.charCodeAt(0)) >>> 0
  return n
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    if (char === "<") return "&lt;"
    if (char === ">") return "&gt;"
    if (char === "&") return "&amp;"
    if (char === '"') return "&quot;"
    return "&apos;"
  })
}

function linesOf(title: string): string[] {
  const words = title.split(/\s+/)
  if (words.length <= 2 || title.length <= 18) return [title]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")]
}

/** A procedural cover, used where the shelf has no image file. */
export function coverDataUri(id: string, title: string, author?: string): string {
  const n = hash(id || title)
  const { bg, ink } = PALETTE[n % PALETTE.length]
  const lines = linesOf(title).slice(0, 3)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">
    <rect width="200" height="300" fill="${bg}"/>
    <rect x="14" y="14" width="172" height="272" fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.7"/>
    <text x="100" y="78" text-anchor="middle" fill="${ink}" font-family="Georgia, serif" font-size="11" letter-spacing="2">${escapeXml((author ?? "Margem").toUpperCase().slice(0, 28))}</text>
    ${lines.map((line, index) => `<text x="100" y="${128 + index * 28}" text-anchor="middle" fill="${ink}" font-family="Georgia, serif" font-size="20" font-style="italic">${escapeXml(line.slice(0, 22))}</text>`).join("")}
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
