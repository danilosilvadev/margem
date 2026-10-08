import { Link } from "react-router-dom"
import { useApp } from "@/state/AppProvider"
import { Button } from "@/components/ui/button"

export function BackupPrompt() {
  const { promptBackup, dismissBackup, exportBackup } = useApp()
  if (!promptBackup) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <aside
        data-testid="backup-prompt"
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-line bg-paper-2 p-4 shadow-lg"
      >
        <p className="font-serif text-lg">Back up your reading data?</p>
        <p className="mt-1 text-sm text-muted">
          Highlights, bookmarks, comments, and your reading key live in this browser. A backup file lets you restore them.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              void exportBackup()
            }}
          >
            Back up now
          </Button>
          <Button variant="line" onClick={() => void dismissBackup()}>
            Later
          </Button>
          <Link to="/settings#backups" className="px-2 text-sm text-muted underline-offset-2 hover:underline">
            Change reminders
          </Link>
        </div>
      </aside>
    </div>
  )
}
