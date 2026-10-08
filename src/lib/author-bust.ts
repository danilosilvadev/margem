function hash(name: string): number {
  let n = 0
  for (const char of name) n = (n * 33 + char.charCodeAt(0)) >>> 0
  return n
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => (char === "&" ? "&amp;" : char === "<" ? "&lt;" : char === ">" ? "&gt;" : char === '"' ? "&quot;" : "&apos;"))
}

/** A portrait medallion drawn from the name, so the tree needs no photo files. */
export function authorBustDataUri(name: string): string {
  const n = hash(name)
  const robes = ["#3a2418", "#1f4d3f", "#1b3a6b", "#5a2348", "#7e1f2e"]
  const robe = robes[n % robes.length]
  const monogram = name
    .split(" ")
    .filter((part) => part && !["de", "von", "of"].includes(part.toLowerCase()))
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150">
    <rect width="120" height="150" fill="#3a1520"/>
    <ellipse cx="60" cy="128" rx="46" ry="28" fill="${robe}"/>
    <circle cx="60" cy="62" r="28" fill="#f0d7b4"/>
    <path d="M34 58 Q40 28 60 26 Q82 24 88 58 Q78 48 60 50 Q42 48 34 58" fill="#2a2118"/>
    <circle cx="50" cy="64" r="2" fill="#2a2118"/>
    <circle cx="70" cy="64" r="2" fill="#2a2118"/>
    <path d="M54 74 Q60 78 66 74" fill="none" stroke="#8a5a48" stroke-width="1.2"/>
    <text x="60" y="146" text-anchor="middle" fill="#e8d6a8" font-family="Georgia, serif" font-size="11">${escapeXml(monogram)}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
