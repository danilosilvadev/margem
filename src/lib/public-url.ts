/** Join Vite's base (for example `/` or `/margem/`) with a public-file path. */
export function joinPublic(base: string, path: string): string {
  const root = base.endsWith("/") ? base : `${base}/`
  return `${root}${path.replace(/^\/+/, "")}`
}

export function publicUrl(path: string): string {
  return joinPublic(import.meta.env.BASE_URL || "/", path)
}
