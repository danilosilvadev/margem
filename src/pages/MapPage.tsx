import { useEffect, useMemo, useState, type PointerEvent } from "react"
import { Link } from "react-router-dom"
import { geoEqualEarth, geoPath } from "d3-geo"
import type { GeoPermissibleObjects } from "d3-geo"
import { ArrowLeft, BookOpen, Globe, Info, X } from "lucide-react"
import { MAP_SECTIONS, type MapCollection, type Region } from "@shared/literary-maps"
import { LiteraryTabs } from "@/components/LiteraryTabs"
import { coverDataUri } from "@/lib/cover-uri"
import { loadCountries, type CountryFeature } from "@/lib/countries"
import { countryNameFor, flagDataUri, NATIONALITY_COORDS } from "@/lib/flags"
import { shelfBooks, sortByMostRead, type ShelfBook } from "@/lib/shelf-books"
import { allProgress } from "@/lib/db"
import { formatYear } from "@shared/literary-canon"

function pluralWorks(count: number): string {
  return `${count} ${count === 1 ? "work" : "works"}`
}

export function MapPage() {
  const books = useMemo(() => shelfBooks(), [])
  const [popularity, setPopularity] = useState<Map<string, number>>(new Map())
  const [openCollection, setOpenCollection] = useState<MapCollection | null>(null)

  useEffect(() => {
    void allProgress()
      .then((rows) => {
        const scores = new Map<string, number>()
        for (const row of rows) scores.set(row.bookId, (scores.get(row.bookId) ?? 0) + 1)
        setPopularity(scores)
      })
      .catch(() => setPopularity(new Map()))
  }, [])

  return (
    <main data-testid="literary-maps" className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <LiteraryTabs variant="light" />
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-hero p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--gold)/0.4),transparent_60%)] opacity-10" />
        <div className="relative">
          <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-cream md:text-3xl">
            <Globe className="size-7" aria-hidden="true" /> Literary Maps
          </h1>
          <p className="mt-1.5 max-w-2xl font-sans text-sm text-cream/75">
            A living atlas of the collection. Choose a collection and see the geography of the classics drawn by the books themselves.
          </p>
        </div>
      </div>

      {MAP_SECTIONS.map((section) => (
        <section key={section.title} className="space-y-3">
          <div>
            <h2 className="font-serif text-lg font-semibold">{section.title}</h2>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
          <div className="flex snap-x gap-4 overflow-x-auto px-1 pb-3" style={{ scrollbarWidth: "none" }}>
            {section.collections.map((collection) => {
              const matches = books.filter((book) => collection.filter(book))
              const count = matches.length
              const sample = sortByMostRead(matches, popularity).slice(0, 4)
              return (
                <button
                  key={collection.id}
                  type="button"
                  data-testid={`map-card-${collection.id}`}
                  onClick={() => setOpenCollection(collection)}
                  disabled={count === 0}
                  className="group/map w-[260px] shrink-0 snap-start text-left disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <article className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-soft ring-1 ring-border/30 transition group-hover/map:-translate-y-1 group-hover/map:shadow-elevated">
                    <div className="relative h-32 overflow-hidden bg-gradient-to-br from-wine to-wine-dark">
                      <MiniMap collection={collection} />
                      <div className="absolute top-2 left-2 text-2xl drop-shadow">{collection.emoji}</div>
                      <div className="absolute right-2 bottom-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] shadow backdrop-blur-sm">
                        {pluralWorks(count)}
                      </div>
                    </div>
                    <div className="space-y-1.5 p-3">
                      <h3 className="line-clamp-1 font-serif text-sm font-semibold group-hover/map:text-primary">{collection.name}</h3>
                      <p className="min-h-[2.4em] text-[11px] leading-relaxed text-muted-foreground line-clamp-2">{collection.description}</p>
                      {sample.length > 0 ? (
                        <div className="flex -space-x-2 pt-1">
                          {sample.map((book) => (
                            <img key={book.id} src={coverDataUri(book.id, book.title, book.authorName)} alt="" className="h-9 w-6 rounded-sm object-cover shadow-sm ring-1 ring-background" />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {openCollection ? (
        <FullscreenMap collection={openCollection} books={books} popularity={popularity} onClose={() => setOpenCollection(null)} />
      ) : null}
    </main>
  )
}

function MiniMap({ collection }: { collection: MapCollection }) {
  return <Atlas collection={collection} books={[]} width={260} height={128} mode="mini" onPick={() => undefined} />
}

function FullscreenMap({
  collection,
  books,
  popularity,
  onClose,
}: {
  collection: MapCollection
  books: ShelfBook[]
  popularity: Map<string, number>
  onClose: () => void
}) {
  const [picked, setPicked] = useState<{ label: string; books: ShelfBook[] } | null>(null)
  const filtered = useMemo(() => books.filter((book) => collection.filter(book)), [books, collection])
  const grouped = useMemo(() => {
    const map = new Map<string, ShelfBook[]>()
    for (const book of filtered) {
      const list = map.get(book.nationality) ?? []
      list.push(book)
      map.set(book.nationality, list)
    }
    for (const [key, list] of map) map.set(key, sortByMostRead(list, popularity))
    return map
  }, [filtered, popularity])

  const regionGroups = useMemo(() => {
    if (!collection.regions) return []
    const norm = (value: string) => value.trim().toLowerCase()
    return collection.regions.map((region) => {
      const names = new Set(region.authors.map(norm))
      const matches = sortByMostRead(
        filtered.filter((book) => names.has(norm(book.authorName))),
        popularity,
      )
      return { region, books: matches }
    })
  }, [collection.regions, filtered, popularity])

  const byCountry = useMemo(() => {
    const map = new Map<string, { nationality: string; books: ShelfBook[] }>()
    for (const [nationality, list] of grouped) {
      const name = countryNameFor(nationality)
      if (!name) continue
      const existing = map.get(name)
      map.set(name, existing ? { nationality, books: sortByMostRead([...existing.books, ...list], popularity) } : { nationality, books: list })
    }
    return map
  }, [grouped, popularity])

  const markers = [...grouped.entries()]
    .filter(([nationality]) => NATIONALITY_COORDS[nationality])
    .map(([nationality, list]) => ({ nationality, books: list, coords: NATIONALITY_COORDS[nationality] }))

  const world = collection.variant === "world-cover"
  const regional = collection.variant === "region-cover"
  const filledRegions = regionGroups.filter((item) => item.books.length > 0).length
  const total = filtered.length
  const legend = regional
    ? [
        { label: "Regions with works", value: `${filledRegions}/${regionGroups.length}` },
        { label: "Works", value: String(total) },
      ]
    : world
      ? [
          { label: "Countries painted", value: String(byCountry.size) },
          { label: "Works", value: String(total) },
        ]
      : [
          { label: "Countries", value: String(markers.length) },
          { label: "Works", value: String(total) },
        ]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-wine-dark via-wine to-wine-dark" data-testid="map-fullscreen">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-wine-dark/80 to-transparent p-4 sm:p-6">
        <div className="pointer-events-auto flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl drop-shadow-lg sm:text-4xl">{collection.emoji}</span>
            <div>
              <h2 className="font-serif text-xl font-bold text-cream sm:text-2xl">{collection.name}</h2>
              <p className="max-w-xl text-xs text-cream/75 sm:text-sm">{collection.description}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-cream hover:bg-cream/10" aria-label="Close map">
            <X className="size-5" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Atlas
          collection={collection}
          books={filtered}
          byCountry={byCountry}
          regionGroups={regionGroups}
          markers={markers}
          width={1200}
          height={700}
          mode="full"
          onPick={setPicked}
        />
      </div>
      <aside className="pointer-events-none absolute bottom-16 left-4 z-10 max-w-[20rem] sm:bottom-20 sm:left-6">
        <div className="pointer-events-auto overflow-hidden rounded-lg border border-gold/40 bg-wine-dark/85 shadow-elevated backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-gold/30 bg-gradient-to-r from-gold/20 to-transparent px-3 py-2">
            <Info className="size-3.5 text-gold" />
            <p className="font-serif text-xs font-semibold tracking-wide text-cream">About this map</p>
          </div>
          <div className="space-y-2 px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-cream/85">{collection.legend || collection.description}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-cream/15 pt-1.5">
              {legend.map((line) => (
                <p key={line.label} className="text-[10px]">
                  <span className="text-cream/55">{line.label}: </span>
                  <span className="font-semibold text-gold-light">{line.value}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </aside>
      <p className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-wine-dark/80 to-transparent p-4 text-center text-xs text-cream/70">
        {regional
          ? `${filledRegions} regions · ${pluralWorks(total)} · click a region`
          : world
            ? `${byCountry.size} ${byCountry.size === 1 ? "country" : "countries"} · ${pluralWorks(total)} · click a country`
            : `${markers.length} ${markers.length === 1 ? "country" : "countries"} · ${pluralWorks(total)} · click a flag`}
      </p>
      {picked ? (
        <div className="absolute inset-x-0 bottom-0 z-20 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-line bg-paper p-4 shadow-2xl md:top-24 md:right-0 md:bottom-0 md:left-auto md:max-h-none md:w-[26rem] md:rounded-none md:border-t-0 md:border-l" data-testid="map-sheet">
          <button type="button" onClick={() => setPicked(null)} className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Back to the map
          </button>
          <h3 className="font-serif text-2xl">{picked.label}</h3>
          <div className="mt-4 space-y-3">
            {picked.books.length === 0 ? (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <BookOpen className="size-4" /> No works
              </p>
            ) : (
              picked.books.map((book) => (
                <Link key={book.id} to={`/book/${book.id}`} className="flex gap-3 rounded-lg p-2 hover:bg-secondary" onClick={onClose}>
                  <img src={coverDataUri(book.id, book.title, book.authorName)} alt="" className="h-16 w-12 shrink-0 rounded object-cover ring-1 ring-border" />
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-serif text-sm font-semibold">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.authorName}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/80">{formatYear(book.publicationYear)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

type Marker = { nationality: string; books: ShelfBook[]; coords: [number, number] }
type RegionGroup = { region: Region; books: ShelfBook[] }

/** Size the cover to the largest landmass so overseas scraps do not stretch it across an ocean. */
function coverFrame(country: CountryFeature, project: (coord: [number, number]) => [number, number] | null): [[number, number], [number, number]] | null {
  const geometry = country.geometry
  const polygons = geometry?.type === "Polygon" ? [geometry.coordinates] : geometry?.type === "MultiPolygon" ? geometry.coordinates : []
  let ring: number[][] | null = null
  let best = 0
  for (const polygon of polygons) {
    const outer = polygon[0]
    if (!outer) continue
    let area = 0
    for (let index = 0; index < outer.length; index += 1) {
      const [x1, y1] = outer[index]
      const [x2, y2] = outer[(index + 1) % outer.length]
      area += x1 * y2 - x2 * y1
    }
    area = Math.abs(area)
    if (area > best) {
      best = area
      ring = outer
    }
  }
  if (!ring) return null
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const [lon, lat] of ring) {
    const point = project([lon, lat])
    if (!point) continue
    x0 = Math.min(x0, point[0])
    y0 = Math.min(y0, point[1])
    x1 = Math.max(x1, point[0])
    y1 = Math.max(y1, point[1])
  }
  if (!Number.isFinite(x0)) return null
  return [[x0, y0], [x1, y1]]
}

function Atlas({
  collection,
  books,
  byCountry,
  regionGroups,
  markers,
  width,
  height,
  mode,
  onPick,
}: {
  collection: MapCollection
  books: ShelfBook[]
  byCountry?: Map<string, { nationality: string; books: ShelfBook[] }>
  regionGroups?: RegionGroup[]
  markers?: Marker[]
  width: number
  height: number
  mode: "mini" | "full"
  onPick: (value: { label: string; books: ShelfBook[] }) => void
}) {
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  useEffect(() => {
    void loadCountries().then(setCountries).catch(() => setCountries([]))
  }, [])

  const projection = useMemo(
    () =>
      geoEqualEarth()
        .scale((mode === "mini" ? collection.projection.scale * 0.18 : collection.projection.scale) * (mode === "full" ? zoom : 1))
        .center(collection.projection.center)
        .translate([width / 2 + (mode === "full" ? pan.x : 0), height / 2 + (mode === "full" ? pan.y : 0)]),
    [collection, width, height, mode, zoom, pan],
  )
  const path = useMemo(() => geoPath(projection), [projection])
  const world = collection.variant === "world-cover" && mode === "full"
  const regional = collection.variant === "region-cover" && mode === "full"

  function drag(event: PointerEvent<SVGSVGElement>) {
    if (mode !== "full" || event.buttons !== 1) return
    const point = { x: event.movementX, y: event.movementY }
    if (point.x === 0 && point.y === 0) return
    setPan((current) => ({ x: current.x + point.x, y: current.y + point.y }))
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full touch-none"
      role="img"
      aria-label={collection.name}
      onPointerMove={drag}
      onWheel={(event) => {
        if (mode !== "full") return
        event.preventDefault()
        setZoom((value) => Math.min(4, Math.max(0.8, value * (event.deltaY > 0 ? 0.92 : 1.08))))
      }}
    >
      <rect width={width} height={height} fill="transparent" />
      <defs>
        {world
          ? countries.map((country) => {
              const name = country.properties?.name
              const entry = name ? byCountry?.get(name) : undefined
              const d = entry ? path(country as GeoPermissibleObjects) : null
              if (!entry || !name || !d) return null
              const safe = name.replace(/[^a-zA-Z0-9]/g, "_")
              return (
                <clipPath key={safe} id={`land-${safe}`}>
                  <path d={d} />
                </clipPath>
              )
            })
          : null}
      </defs>
      {countries.map((country) => {
        const name = country.properties?.name
        const d = path(country as GeoPermissibleObjects)
        if (!d) return null
        const focused = regional && collection.countryFilter ? !!name && collection.countryFilter(name) : false
        const entry = world && name ? byCountry?.get(name) : undefined
        if (entry && name) {
          const safe = name.replace(/[^a-zA-Z0-9]/g, "_")
          const frame = coverFrame(country, (coord) => projection(coord)) ?? path.bounds(country as GeoPermissibleObjects)
          const [[x0, y0], [x1, y1]] = frame
          const cover = coverDataUri(entry.books[0].id, entry.books[0].title, entry.books[0].authorName)
          return (
            <g key={safe} className="cursor-pointer" onClick={() => onPick({ label: entry.nationality, books: entry.books })}>
              <image href={cover} x={x0} y={y0} width={Math.max(1, x1 - x0)} height={Math.max(1, y1 - y0)} preserveAspectRatio="xMidYMid slice" clipPath={`url(#land-${safe})`} />
              <path d={d} fill="transparent" stroke="hsl(42 70% 55% / 0.85)" strokeWidth={0.7} />
            </g>
          )
        }
        return (
          <path
            key={(name ?? "land") + d.slice(0, 18)}
            d={d}
            fill={focused ? "hsl(42 70% 55% / 0.22)" : mode === "mini" ? "hsl(30 25% 97% / 0.15)" : "hsl(30 25% 97% / 0.08)"}
            stroke={focused ? "hsl(42 70% 55%)" : mode === "mini" ? "hsl(30 25% 97% / 0.5)" : "hsl(30 25% 97% / 0.45)"}
            strokeWidth={focused ? 1.4 : 0.45}
          />
        )
      })}
      {mode === "full" && !world && !regional
        ? markers?.map((marker) => {
            const point = projection(marker.coords)
            if (!point) return null
            const flag = flagDataUri(marker.nationality)
            return (
              <g key={marker.nationality} transform={`translate(${point[0]} ${point[1]})`} className="cursor-pointer" onClick={() => onPick({ label: marker.nationality, books: marker.books })}>
                <circle r={16} fill="hsl(42 70% 55%)" opacity={0.3} />
                <circle r={14} fill="hsl(30 25% 97%)" stroke="hsl(42 70% 55%)" />
                {flag ? (
                  <image href={flag} x={-12} y={-12} width={24} height={24} clipPath="inset(0 round 12px)" preserveAspectRatio="xMidYMid slice" />
                ) : null}
                {marker.books.length > 1 ? (
                  <g transform="translate(10 -10)">
                    <circle r={6} fill="hsl(42 70% 55%)" stroke="hsl(30 25% 97%)" />
                    <text textAnchor="middle" dy="2.2" fontSize="7" fontWeight="700" fill="hsl(350 50% 20%)">
                      {marker.books.length}
                    </text>
                  </g>
                ) : null}
              </g>
            )
          })
        : null}
      {regional
        ? regionGroups?.map(({ region, books: regionBooks }) => {
            const point = projection(region.center)
            if (!point) return null
            const cover = regionBooks[0] ? coverDataUri(regionBooks[0].id, regionBooks[0].title, regionBooks[0].authorName) : null
            return (
              <g
                key={region.id}
                transform={`translate(${point[0]} ${point[1]})`}
                className={regionBooks.length ? "cursor-pointer" : undefined}
                onClick={() => regionBooks.length && onPick({ label: region.name, books: regionBooks })}
              >
                <rect x={-22} y={-32} width={44} height={64} rx={3} fill="hsl(42 70% 55%)" opacity={0.45} />
                <rect x={-20} y={-30} width={40} height={60} rx={2} fill="hsl(30 25% 97%)" stroke="hsl(42 70% 55%)" strokeWidth={1.2} />
                {cover ? <image href={cover} x={-18} y={-28} width={36} height={56} preserveAspectRatio="xMidYMid slice" /> : <text textAnchor="middle" dy="4" fontSize="14" fill="hsl(350 50% 20%)" opacity={0.4}>—</text>}
                <text y={48} textAnchor="middle" fontSize="11" fill="hsl(30 25% 97%)" fontFamily="Georgia, serif">
                  {region.name}
                </text>
              </g>
            )
          })
        : null}
      {books.length === 0 && mode === "mini" ? null : null}
    </svg>
  )
}
