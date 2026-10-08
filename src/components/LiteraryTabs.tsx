import { Link, useLocation } from "react-router-dom"

const tabs = [
  { to: "/map", label: "World map" },
  { to: "/journey", label: "Journey" },
  { to: "/tree", label: "Family tree" },
  { to: "/openings", label: "Opening lines" },
]

export function LiteraryTabs() {
  const { pathname } = useLocation()
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gold/30 bg-hero px-4 py-3 text-cream">
      <p className="font-serif text-xs font-bold tracking-[0.18em] text-gold uppercase">Literary games</p>
      <nav className="flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`rounded-full px-3 py-1 text-[11px] ${active ? "bg-gold font-semibold text-wine-dark" : "bg-cream/10 text-cream/80 hover:bg-cream/20"}`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
