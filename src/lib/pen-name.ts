const FIRST = ["Quiet", "Amber", "Late", "Ink", "Paper", "Night", "Gold", "River", "Cedar", "Linen", "Vesper", "Silver", "Willow", "Cinder", "Fable", "Harbor"]
const SECOND = ["Margin", "Folio", "Lamp", "Quill", "Reader", "Index", "Chorus", "Atlas", "Cipher", "Sonnet", "Vellum", "Pilgrim", "Witness", "Ledger", "Keepsake", "Scribe"]

function chunk(pubkey: string, start: number): number {
  const hex = pubkey.replace(/[^0-9a-f]/gi, "").padEnd(start + 8, "0").slice(start, start + 8)
  return Number.parseInt(hex, 16) || 0
}

/** A stable literary nickname from a public key. The key itself stays on the tooltip. */
export function penName(pubkey: string): string {
  const a = chunk(pubkey, 0)
  const b = chunk(pubkey, 8)
  return `${FIRST[a % FIRST.length]} ${SECOND[b % SECOND.length]}`
}

export function identiconCells(pubkey: string): boolean[] {
  const cells: boolean[] = []
  const hex = pubkey.replace(/[^0-9a-f]/gi, "").padEnd(12, "0")
  for (let row = 0; row < 5; row++) {
    const byte = Number.parseInt(hex.slice(row * 2, row * 2 + 2), 16) || 0
    const bits = [Boolean(byte & 1), Boolean(byte & 2), Boolean(byte & 4)]
    cells.push(bits[0], bits[1], bits[2], bits[1], bits[0])
  }
  return cells
}
