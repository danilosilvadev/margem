import { Link, Outlet, useMatch } from "react-router-dom"
import { brand } from "@shared/brand"
import { BackupPrompt } from "@/components/BackupPrompt"
import { useApp } from "@/state/AppProvider"

const links = [
  { to: "/", label: "Explore" },
  { to: "/shelf", label: "Shelf" },
  { to: "/map", label: "Map" },
  { to: "/journey", label: "Journey" },
  { to: "/tree", label: "Tree" },
  { to: "/community", label: "Community" },
  { to: "/settings", label: "Settings" },
]

export function Shell() {
  const reading = useMatch("/read/:bookId/:chapterId")
  const { syncStatus, directPeers } = useApp()
  const syncLabel =
    syncStatus === "open" ? (directPeers > 0 ? `Relay · ${directPeers} direct` : "Relay connected") : syncStatus === "connecting" ? "Connecting" : "Comments saved here"
  return (
    <div className="min-h-screen bg-background text-foreground">
      {reading ? null : (
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <Link to="/" className="font-serif text-2xl tracking-tight text-primary">
              {brand.name}
            </Link>
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {links.map((link) => (
                <Link key={link.to} to={link.to} className="text-muted-foreground hover:text-primary">
                  {link.label}
                </Link>
              ))}
            </nav>
            <span className="ml-auto text-xs text-muted-foreground" data-testid="sync-status">
              {syncLabel}
            </span>
          </div>
        </header>
      )}
      <Outlet />
      <BackupPrompt />
    </div>
  )
}
