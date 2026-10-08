import { useState } from "react"
import { Link, NavLink, Outlet, useMatch } from "react-router-dom"
import { brand } from "@shared/brand"
import { BackupPrompt } from "@/components/BackupPrompt"
import { useApp } from "@/state/AppProvider"

const desktopLinks = [
  { to: "/", label: "Explore", end: true },
  { to: "/shelf", label: "Shelf" },
  { to: "/map", label: "Map" },
  { to: "/journey", label: "Journey" },
  { to: "/tree", label: "Tree" },
  { to: "/community", label: "Community" },
  { to: "/settings", label: "Settings" },
]

const tabs = [
  { to: "/", label: "Explore", end: true },
  { to: "/shelf", label: "Shelf" },
  { to: "/map", label: "Map" },
  { to: "/community", label: "Community" },
]

const moreLinks = [
  { to: "/journey", label: "Journey" },
  { to: "/tree", label: "Family tree" },
  { to: "/openings", label: "Opening lines" },
  { to: "/settings", label: "Settings" },
]

export function Shell() {
  const reading = useMatch("/read/:bookId/:chapterId")
  const { syncStatus, directPeers } = useApp()
  const [more, setMore] = useState(false)
  const syncLabel =
    syncStatus === "open" ? (directPeers > 0 ? `Relay · ${directPeers} direct` : "Relay connected") : syncStatus === "connecting" ? "Connecting" : "Comments saved here"
  return (
    <div className="min-h-screen bg-background text-foreground">
      {reading ? null : (
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
            <Link to="/" className="shrink-0 font-serif text-2xl tracking-tight text-primary">
              {brand.name}
            </Link>
            <nav className="hidden items-center gap-3 text-sm md:flex">
              {desktopLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => (isActive ? "text-primary" : "text-muted-foreground hover:text-primary")}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <span className="ml-auto hidden text-xs text-muted-foreground lg:inline" data-testid="sync-status">
              {syncLabel}
            </span>
          </div>
        </header>
      )}
      <div className={reading ? undefined : "pb-20 md:pb-8"}>
        <Outlet />
      </div>
      {reading ? null : (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden" aria-label="Primary">
          <ul className="grid grid-cols-5">
            {tabs.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  onClick={() => setMore(false)}
                  className={({ isActive }) =>
                    `flex h-14 items-center justify-center text-xs ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                className={`flex h-14 w-full items-center justify-center text-xs ${more ? "font-semibold text-primary" : "text-muted-foreground"}`}
                aria-expanded={more}
                onClick={() => setMore((open) => !open)}
              >
                More
              </button>
            </li>
          </ul>
          {more ? (
            <ul className="absolute inset-x-0 bottom-14 border-t border-border bg-background px-2 py-2 shadow-elevated">
              {moreLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setMore(false)}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-3 text-sm ${isActive ? "bg-secondary font-semibold text-primary" : "text-foreground"}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : null}
        </nav>
      )}
      <BackupPrompt docked={!reading} />
    </div>
  )
}
