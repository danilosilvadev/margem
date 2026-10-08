import { EMPTY_PROGRESS, type GameProgress } from "@shared/games"

const KEY = "margem-games"

export function loadGameProgress(): GameProgress {
  if (typeof localStorage === "undefined") return structuredClone(EMPTY_PROGRESS)
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(EMPTY_PROGRESS)
    const parsed = JSON.parse(raw) as Partial<GameProgress>
    return {
      map: { ...EMPTY_PROGRESS.map, ...parsed.map },
      tree: { ...EMPTY_PROGRESS.tree, ...parsed.tree },
      openings: { ...EMPTY_PROGRESS.openings, ...parsed.openings },
      journey: Array.isArray(parsed.journey) ? parsed.journey : [],
    }
  } catch {
    return structuredClone(EMPTY_PROGRESS)
  }
}

export function saveGameProgress(progress: GameProgress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}
