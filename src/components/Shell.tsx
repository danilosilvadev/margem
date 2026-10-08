import { Link, Outlet, useMatch } from "react-router-dom"
import { brand } from "@shared/brand"
import { BackupPrompt } from "@/components/BackupPrompt"
import { useApp } from "@/state/AppProvider"

export function Shell() {
  const reading = useMatch("/read/:bookId/:chapterId")
  const { syncStatus, directPeers } = useApp()
  const syncLabel =
    syncStatus === "open" ? (directPeers > 0 ? `Relay · ${directPeers} direct` : "Relay connected") : syncStatus === "connecting" ? "Connecting" : "Comments saved here"
  return (
    <div className="min-h-screen">
      {reading ? null : (
        <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
            <Link to="/" className="font-serif text-2xl tracking-tight">
              {brand.name}
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <span className="text-muted" data-testid="sync-status">
                {syncLabel}
              </span>
              <Link to="/settings" className="hover:text-accent">
                Settings
              </Link>
            </nav>
          </div>
        </header>
      )}
      <Outlet />
      <BackupPrompt />
    </div>
  )
}
