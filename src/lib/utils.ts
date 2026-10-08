import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortKey(pubkey: string): string {
  if (pubkey.length < 12) return pubkey
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`
}

export function formatStamp(ms: number): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms))
}

export function formatCommentTime(seconds: number): string {
  const delta = Date.now() - seconds * 1000
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (delta < minute) return "just now"
  if (delta < hour) return `${Math.floor(delta / minute)}m ago`
  if (delta < day) return `${Math.floor(delta / hour)}h ago`
  return formatStamp(seconds * 1000)
}
