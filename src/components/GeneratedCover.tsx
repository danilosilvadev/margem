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

function titleLines(title: string): string[] {
  const words = title.split(/\s+/)
  if (words.length <= 2 || title.length <= 16) return [title]
  const mid = Math.ceil(words.length / 2)
  const lines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")]
  if (lines[0].length > 18 && words.length > 3) {
    return [words.slice(0, 2).join(" "), words.slice(2, 4).join(" "), words.slice(4).join(" ")].filter(Boolean)
  }
  return lines
}

export function GeneratedCover({
  bookId,
  title,
  author,
  className,
}: {
  bookId: string
  title: string
  author?: string
  className?: string
}) {
  const n = hash(bookId || title)
  const { bg, ink } = PALETTE[n % PALETTE.length]
  const pattern = n % 4
  const lines = titleLines(title)
  const size = lines.some((line) => line.length > 16) ? 16 : 20
  const patternId = `cover-${n.toString(36)}`
  return (
    <svg viewBox="0 0 200 300" className={className} role="img" aria-label={author ? `${title}, ${author}` : title}>
      <defs>
        {pattern === 0 ? (
          <pattern id={patternId} width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M18 36 A18 18 0 0 1 0 18 M18 36 A12 12 0 0 1 6 24" fill="none" stroke={ink} strokeWidth="0.7" opacity="0.45" />
            <path d="M18 36 A18 18 0 0 0 36 18 M18 36 A12 12 0 0 0 30 24" fill="none" stroke={ink} strokeWidth="0.7" opacity="0.45" />
          </pattern>
        ) : null}
        {pattern === 1 ? (
          <pattern id={patternId} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M14 0 L28 14 L14 28 L0 14 Z" fill="none" stroke={ink} strokeWidth="0.7" opacity="0.4" />
          </pattern>
        ) : null}
        {pattern === 2 ? (
          <pattern id={patternId} width="32" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 20 A8 8 0 0 1 16 20 A8 8 0 0 1 32 20" fill="none" stroke={ink} strokeWidth="0.7" opacity="0.45" />
          </pattern>
        ) : null}
        {pattern === 3 ? (
          <pattern id={patternId} width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="8" fill="none" stroke={ink} strokeWidth="0.7" opacity="0.4" />
            <circle cx="15" cy="15" r="3" fill="none" stroke={ink} strokeWidth="0.6" opacity="0.4" />
          </pattern>
        ) : null}
      </defs>
      <rect width="200" height="300" fill={bg} />
      <rect width="200" height="300" fill={`url(#${patternId})`} />
      <rect x="14" y="14" width="172" height="272" fill="none" stroke={ink} strokeWidth="1.2" opacity="0.7" />
      <rect x="18" y="18" width="164" height="264" fill="none" stroke={ink} strokeWidth="0.5" opacity="0.5" />
      {author ? (
        <text x="100" y="78" textAnchor="middle" fill={ink} fontFamily="Georgia, serif" fontSize="9" letterSpacing="2.2">
          {author.toUpperCase().slice(0, 28)}
        </text>
      ) : null}
      <line x1="62" y1="90" x2="138" y2="90" stroke={ink} strokeWidth="0.6" opacity="0.7" />
      {lines.map((line, index) => (
        <text
          key={line}
          x="100"
          y={138 + index * (size + 6)}
          textAnchor="middle"
          fill={ink}
          fontFamily="Georgia, serif"
          fontSize={size}
          fontStyle="italic"
        >
          {line}
        </text>
      ))}
      <text x="100" y="268" textAnchor="middle" fill={ink} fontFamily="Georgia, serif" fontSize="8" letterSpacing="3.5" opacity="0.8">
        MARGEM
      </text>
    </svg>
  )
}
