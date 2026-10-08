import { Link, useLocation } from "react-router-dom"
import { Compass, Gamepad2, Globe, TreePine } from "lucide-react"

const tabs = [
  { to: "/map", label: "World Map", icon: Globe },
  { to: "/journey", label: "Journey through Literature", icon: Compass },
  { to: "/tree", label: "Family Tree", icon: TreePine },
]

export function LiteraryTabs({ variant = "light" }: { variant?: "dark" | "light" }) {
  const { pathname } = useLocation()
  const dark = variant === "dark"
  return (
    <div
      data-testid="literary-tabs"
      className={
        dark
          ? "flex flex-wrap items-center gap-3"
          : "mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gold/30 bg-hero px-4 py-3 text-cream"
      }
    >
      <div className="flex items-center gap-1.5">
        <Gamepad2 className="size-4 text-gold" aria-hidden="true" />
        <span className="font-serif text-xs font-bold tracking-[0.18em] text-gold/90 uppercase">Literary games</span>
      </div>
      <div className="hidden h-4 w-px bg-cream/20 sm:block" />
      <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = pathname === tab.to
          const Icon = tab.icon
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] whitespace-nowrap ${
                active ? "bg-gold font-semibold text-wine-dark" : "bg-cream/10 text-cream/80 hover:bg-cream/20"
              }`}
            >
              <Icon className="size-3" aria-hidden="true" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
