import { useMemo, useState } from "react"
import { BookOpen, MapPin, Sparkles } from "lucide-react"
import type { BookProfile, ProfilePlace } from "@shared/book-profile"
import { WORLD_LAND_D } from "@/assets/world-land"

const W = 1000
const H = 500

function project(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * W, ((90 - lat) / 180) * H]
}

function isReal(place: ProfilePlace): place is ProfilePlace & { lon: number; lat: number } {
  return place.lon != null && place.lat != null && !place.imagined
}

function fitView(points: [number, number][]): { x: number; y: number; w: number; h: number } {
  if (points.length === 0) return { x: 0, y: 0, w: W, h: H }
  const xs = points.map((point) => point[0])
  const ys = points.map((point) => point[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const padX = Math.max(36, (maxX - minX) * 0.55 || 50)
  const padY = Math.max(22, (maxY - minY) * 0.7 || 30)
  let x = minX - padX
  let y = minY - padY
  let w = maxX - minX + padX * 2
  let h = maxY - minY + padY * 2
  const ratio = 16 / 10
  if (w / h < ratio) {
    const next = h * ratio
    x -= (next - w) / 2
    w = next
  } else {
    const next = w / ratio
    y -= (next - h) / 2
    h = next
  }
  w = Math.min(W, Math.max(w, 80))
  h = Math.min(H, Math.max(h, 50))
  x = Math.max(0, Math.min(W - w, x))
  y = Math.max(0, Math.min(H - h, y))
  return { x, y, w, h }
}

export function BookSceneMap({ profile }: { profile: BookProfile }) {
  const real = useMemo(() => profile.places.filter(isReal), [profile.places])
  const [active, setActive] = useState<number | null>(null)
  const view = useMemo(() => fitView(real.map((place) => project(place.lon, place.lat))), [real])
  const showMap = profile.placesKind !== "imagined" && real.length > 0

  return (
    <div className="space-y-3">
      {showMap ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-gradient-to-br from-wine-dark via-wine to-wine-dark">
          <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="h-full w-full" role="img" aria-label="Places in the work">
            <rect x={0} y={0} width={W} height={H} fill="hsl(350 50% 16%)" />
            <path d={WORLD_LAND_D} fill="hsl(30 25% 97% / 0.14)" stroke="hsl(30 25% 97% / 0.45)" strokeWidth={view.w > 400 ? 0.6 : 0.25} />
            {real.map((place) => {
              const index = profile.places.indexOf(place)
              const [x, y] = project(place.lon, place.lat)
              const on = active === index
              const radius = Math.max(view.w * 0.012, 1.1)
              return (
                <g key={place.name} className="cursor-pointer" onClick={() => setActive(on ? null : index)}>
                  <title>{place.name}</title>
                  <circle cx={x} cy={y} r={radius * (on ? 2.2 : 1.6)} fill="hsl(42 70% 55%)" opacity={0.35} />
                  <circle cx={x} cy={y} r={radius} fill="hsl(42 70% 55%)" stroke="hsl(30 25% 97%)" strokeWidth={radius * 0.28} />
                  <text x={x} y={y + radius * 0.35} textAnchor="middle" fontSize={radius * 1.15} fontFamily="Georgia, serif" fill="hsl(350 50% 16%)">
                    {index + 1}
                  </text>
                </g>
              )
            })}
          </svg>
          <p className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md border border-gold/40 bg-wine-dark/85 px-2.5 py-1.5 text-[10px] text-cream/85">
            <MapPin className="size-3 text-gold" aria-hidden="true" />
            {real.length} {real.length === 1 ? "real place" : "real places"}
          </p>
        </div>
      ) : null}
      <ol className="space-y-2">
        {profile.places.map((place, index) => {
          const located = isReal(place)
          const on = active === index
          return (
            <li key={place.name}>
              <button
                type="button"
                disabled={!located}
                onClick={() => setActive(on ? null : index)}
                className={`flex w-full gap-3 rounded-lg border p-3 text-left transition ${
                  on ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30" : "border-border/70 bg-card hover:border-border"
                } ${located ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full font-serif text-xs font-bold ${
                    located ? "bg-gold text-wine-dark" : "border border-dashed border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {located ? index + 1 : <Sparkles className="size-3.5" aria-hidden="true" />}
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="font-serif text-sm font-semibold">{place.name}</span>
                    {!located ? <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Imagined place</span> : null}
                    {place.passage ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <BookOpen className="size-2.5" aria-hidden="true" /> {place.passage}
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">{place.description}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
