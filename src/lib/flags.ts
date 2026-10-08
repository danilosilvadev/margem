/** Simplified flags as data URIs so the atlas works offline. */
const FLAGS: Record<string, string> = {
  br: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#009b3a"/><polygon points="30,6 54,20 30,34 6,20" fill="#fedf00"/><circle cx="30" cy="20" r="8" fill="#002776"/></svg>`,
  fr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="20" height="40" fill="#0055a4"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ef4135"/></svg>`,
  it: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="20" height="40" fill="#009246"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ce2b37"/></svg>`,
  pt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="24" height="40" fill="#006600"/><rect x="24" width="36" height="40" fill="#ff0000"/><circle cx="24" cy="20" r="7" fill="none" stroke="#ffcc00" stroke-width="2"/></svg>`,
  es: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#c60b1e"/><rect y="10" width="60" height="20" fill="#ffc400"/></svg>`,
  de: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="13.3" fill="#000"/><rect y="13.3" width="60" height="13.4" fill="#dd0000"/><rect y="26.7" width="60" height="13.3" fill="#ffce00"/></svg>`,
  ru: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="13.3" fill="#fff"/><rect y="13.3" width="60" height="13.4" fill="#0039a6"/><rect y="26.7" width="60" height="13.3" fill="#d52b1e"/></svg>`,
  cz: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="20" fill="#fff"/><rect y="20" width="60" height="20" fill="#d7141a"/><polygon points="0,0 26,20 0,40" fill="#11457e"/></svg>`,
  gr: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#0d5eaf"/><g fill="#fff"><rect y="4.4" width="60" height="4.4"/><rect y="13.2" width="60" height="4.4"/><rect y="22" width="60" height="4.4"/><rect y="30.8" width="60" height="4.4"/><rect width="22" height="22"/><rect x="9" y="2" width="4" height="18"/><rect x="2" y="9" width="18" height="4" fill="#0d5eaf"/></g></svg>`,
  gb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#c8102e" stroke-width="4"/><path d="M30 0 V40 M0 20 H60" stroke="#fff" stroke-width="12"/><path d="M30 0 V40 M0 20 H60" stroke="#c8102e" stroke-width="7"/></svg>`,
  ie: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="20" height="40" fill="#169b62"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ff883e"/></svg>`,
  us: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#bf0a30"/><g fill="#fff"><rect y="3" width="60" height="3"/><rect y="9" width="60" height="3"/><rect y="15" width="60" height="3"/><rect y="21" width="60" height="3"/><rect y="27" width="60" height="3"/><rect y="33" width="60" height="3"/></g><rect width="26" height="21" fill="#002868"/></svg>`,
  co: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="20" fill="#fcd116"/><rect y="20" width="60" height="10" fill="#003893"/><rect y="30" width="60" height="10" fill="#ce1126"/></svg>`,
  ar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="13.3" fill="#74acdf"/><rect y="13.3" width="60" height="13.4" fill="#fff"/><rect y="26.7" width="60" height="13.3" fill="#74acdf"/><circle cx="30" cy="20" r="4" fill="#f6b40e"/></svg>`,
  jp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="8" fill="#bc002d"/></svg>`,
  cn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#de2910"/><polygon points="12,8 13.2,12 17,12 14,14.4 15.2,18 12,15.6 8.8,18 10,14.4 7,12 10.8,12" fill="#ffde00"/></svg>`,
  sa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#006c35"/><rect y="28" width="60" height="4" fill="#fff"/></svg>`,
}

const NATIONALITY_CODE: Record<string, string> = {
  Brazilian: "br",
  Colombian: "co",
  French: "fr",
  Italian: "it",
  Portuguese: "pt",
  Spanish: "es",
  German: "de",
  Russian: "ru",
  Czech: "cz",
  Greek: "gr",
  Roman: "it",
  English: "gb",
  British: "gb",
  Irish: "ie",
  Japanese: "jp",
  Chinese: "cn",
  Arab: "sa",
  American: "us",
  Argentine: "ar",
}

export function flagDataUri(nationality: string | null | undefined): string | null {
  if (!nationality) return null
  const code = NATIONALITY_CODE[nationality]
  const svg = code ? FLAGS[code] : undefined
  return svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : null
}

export const NATIONALITY_TO_COUNTRY: Record<string, string> = {
  Brazilian: "Brazil",
  Colombian: "Colombia",
  French: "France",
  Italian: "Italy",
  Portuguese: "Portugal",
  Spanish: "Spain",
  German: "Germany",
  Russian: "Russia",
  Czech: "Czechia",
  Greek: "Greece",
  Roman: "Italy",
  English: "United Kingdom",
  British: "United Kingdom",
  Irish: "Ireland",
  Japanese: "Japan",
  Chinese: "China",
  Arab: "Saudi Arabia",
  American: "United States of America",
  Argentine: "Argentina",
}

export function countryNameFor(nationality: string | null | undefined): string | null {
  if (!nationality) return null
  return NATIONALITY_TO_COUNTRY[nationality] ?? null
}

export const NATIONALITY_COORDS: Record<string, [number, number]> = {
  Brazilian: [-51.9, -14.2],
  Colombian: [-74.3, 4.6],
  French: [2.2, 46.2],
  Italian: [12.6, 41.9],
  Portuguese: [-8.2, 39.4],
  Spanish: [-3.7, 40.4],
  German: [10.5, 51.2],
  Russian: [60, 56],
  Czech: [15.5, 49.8],
  Greek: [21.8, 39.1],
  Roman: [12.6, 41.9],
  English: [-1.5, 52.5],
  British: [-3.4, 55.4],
  Irish: [-8.2, 53.4],
  Japanese: [138.3, 36.2],
  Chinese: [104.2, 35.9],
  Arab: [45.1, 23.9],
  American: [-97, 39],
  Argentine: [-64, -34],
}
