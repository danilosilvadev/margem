export const LANGS = ["en", "pt", "es"] as const
export type Lang = (typeof LANGS)[number]

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
}

export const LANG_SHORT: Record<Lang, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
}

export type Right = {
  lang: Lang
  title: string
  credit: string
  edition: string
  source: string
  rationale: string
}

export type Paragraph = {
  id: string
} & Partial<Record<Lang, string>>

export type Chapter = {
  id: string
  title: Record<Lang, string>
  paragraphs: Paragraph[]
}

export type Book = {
  id: string
  languages: Lang[]
  title: Record<Lang, string>
  authors: { name: string; role: string; years?: string }[]
  year: number
  summary: string
  rights: Right[]
  chapters: Chapter[]
}

export type CatalogChapter = {
  id: string
  title: Record<Lang, string>
  paragraphCount: number
}

export type CatalogBook = Omit<Book, "chapters"> & {
  chapters: CatalogChapter[]
}

export type Progress = {
  bookId: string
  chapterId: string
  paragraphId: string
  updatedAt: number
}

export type Bookmark = {
  id: string
  bookId: string
  chapterId: string
  paragraphId: string
  createdAt: number
}

export type Highlight = {
  id: string
  bookId: string
  chapterId: string
  paragraphId: string
  lang: Lang
  quote: string
  createdAt: number
}

export type ShelfItem = {
  bookId: string
  addedAt: number
}

export type ThemeName = "light" | "sepia" | "dark"
export type MobileMode = "stack" | "focus"
export type ReminderFrequency = "daily" | "3d" | "weekly" | "off"

export type Settings = {
  theme: ThemeName
  fontSize: number
  relayUrl: string
  columns: 1 | 2 | 3
  columnLangs: [Lang, Lang, Lang]
  mobileMode: MobileMode
  focusLang: Lang
}

export type BackupState = {
  frequency: ReminderFrequency
  lastBackupAt: number | null
  lastBackupRevision: number
  lastDismissedAt: number | null
  dataRevision: number
}
