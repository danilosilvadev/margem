import { Link } from "react-router-dom"
import { useApp } from "@/state/AppProvider"
import { Button } from "@/components/ui/button"

export function BackupPrompt({ docked = false }: { docked?: boolean }) {
  const { promptBackup, dismissBackup, exportBackup } = useApp()
  if (!promptBackup) return null
  return (
    <aside
      data-testid="backup-prompt"
      className={`pointer-events-auto fixed z-40 w-auto rounded-xl border border-line bg-paper-2 px-3 py-2 shadow-lg ${
        docked ? "inset-x-3 bottom-[4.5rem] md:inset-x-auto md:right-4 md:bottom-4 md:w-72" : "right-3 bottom-3 w-[min(18rem,calc(100%-1.5rem))]"
      }`}
    >
      <p className="font-serif text-sm leading-tight">Back up this browser?</p>
      <p className="mt-1 hidden text-xs text-muted-foreground md:block">Highlights and your reading key stay on this device until you save a file.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            void exportBackup()
          }}
        >
          Back up now
        </Button>
        <Button size="sm" variant="line" onClick={() => void dismissBackup()}>
          Later
        </Button>
        <Link to="/settings#backups" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
          Reminders
        </Link>
      </div>
    </aside>
  )
}
