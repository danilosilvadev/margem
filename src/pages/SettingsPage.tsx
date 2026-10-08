import { useState } from "react"
import { brand } from "@shared/brand"
import type { ReminderFrequency, ThemeName } from "@shared/types"
import { reminderIntervalMs } from "@shared/backup"
import { replaceFromBackup, saveIdentity } from "@/lib/db"
import { readJsonFile } from "@/lib/files"
import { formatStamp, shortKey } from "@/lib/utils"
import { useApp } from "@/state/AppProvider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const FREQUENCIES: { id: ReminderFrequency; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "3d", label: "Every 3 days" },
  { id: "weekly", label: "Weekly" },
  { id: "off", label: "Off" },
]

export function SettingsPage() {
  const app = useApp()
  const [name, setName] = useState(app.identity.displayName)
  const [phrase, setPhrase] = useState("")
  const [showPhrase, setShowPhrase] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState<Awaited<ReturnType<typeof app.importTransfer>> | null>(null)
  const [phraseOpen, setPhraseOpen] = useState(false)

  const last = app.backup.lastBackupAt ? formatStamp(app.backup.lastBackupAt) : "No backup yet"
  const dirty = app.backup.dataRevision > app.backup.lastBackupRevision

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <h1 className="font-serif text-4xl">Settings</h1>
      <p className="mt-2 text-sm text-muted">
        {brand.name} keeps your reading on this device. There is no account.
      </p>

      <section className="mt-10 space-y-3" id="appearance">
        <h2 className="font-serif text-2xl">Appearance</h2>
        <div className="flex flex-wrap gap-2">
          {(["light", "sepia", "dark"] as ThemeName[]).map((theme) => (
            <Button key={theme} variant={app.settings.theme === theme ? "default" : "line"} onClick={() => void app.updateSettings({ theme })}>
              {theme}
            </Button>
          ))}
        </div>
        <Label htmlFor="relay">Relay address</Label>
        <Input
          id="relay"
          defaultValue={app.settings.relayUrl}
          key={app.settings.relayUrl}
          onBlur={(event) => {
            const relayUrl = event.target.value.trim()
            if (relayUrl && relayUrl !== app.settings.relayUrl) void app.updateSettings({ relayUrl })
          }}
        />
        <p className="text-sm text-muted">
          Sync is {app.syncStatus}. {app.directPeers > 0 ? `${app.directPeers} direct link${app.directPeers === 1 ? "" : "s"} open.` : "Direct links open when another reader of the same book is online."}
        </p>
        {app.ownerPubkey ? <p className="text-xs text-muted">Moderator key {shortKey(app.ownerPubkey)}. This relay can publish a signed removal list, and this app honors it.</p> : null}
      </section>

      <section className="mt-10 space-y-3" id="name">
        <h2 className="font-serif text-2xl">Name on comments</h2>
        <Label htmlFor="display-name">Display name</Label>
        <div className="flex gap-2">
          <Input id="display-name" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Optional" />
          <Button variant="line" onClick={() => void app.setDisplayName(name)}>
            Save
          </Button>
        </div>
        <p className="text-sm text-muted">Your id is the public key {shortKey(app.identity.publicKey)}. The name is optional and signed, like a comment.</p>
      </section>

      <section className="mt-10 space-y-3" id="backups">
        <h2 className="font-serif text-2xl">Backups</h2>
        <p className="text-sm">
          Last backup: <span data-testid="last-backup">{last}</span>
        </p>
        <p className="text-sm text-muted">
          {dirty
            ? "There are changes on this device since that backup."
            : "The last backup matches what is stored here."}{" "}
          {app.backup.frequency === "off"
            ? "Reminders are off."
            : `A reminder can appear every ${Math.round((reminderIntervalMs(app.backup.frequency) ?? 0) / 86_400_000)} day(s), and only if something changed. Nothing is written unless you choose Back up now.`}
        </p>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((item) => (
            <Button key={item.id} size="sm" variant={app.backup.frequency === item.id ? "default" : "line"} onClick={() => void app.setFrequency(item.id)}>
              {item.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              void app.exportBackup().then((result) => {
                if (result !== "cancelled") setMessage(result === "shared" ? "Share sheet opened." : "Backup file downloaded.")
              })
            }}
          >
            Back up now
          </Button>
          <label className="inline-flex">
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (!file) return
                void readJsonFile(file)
                  .then((raw) => app.importTransfer(raw))
                  .then((parsed) => setPending(parsed))
                  .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not read that file"))
              }}
            />
            <span className="inline-flex h-10 cursor-pointer items-center rounded-full border border-line bg-paper-2 px-4 text-sm">Restore from file</span>
          </label>
        </div>
      </section>

      <section className="mt-10 space-y-3" id="key">
        <h2 className="font-serif text-2xl">Reading key</h2>
        <p className="text-sm text-muted">
          Created on this device {formatStamp(app.identity.createdAt)}. Write the phrase down if you want to move the key. Anyone with it can post as you.
        </p>
        <Button variant="line" onClick={() => setShowPhrase((value) => !value)}>
          {showPhrase ? "Hide recovery phrase" : "Show recovery phrase"}
        </Button>
        {showPhrase ? <p className="rounded-xl bg-paper-2 p-4 font-serif text-lg leading-relaxed">{app.identity.mnemonic}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="line" onClick={() => void app.exportIdentity().then(() => setMessage("Identity file saved. It contains your secret key."))}>
            Export key file
          </Button>
          <Button variant="line" onClick={() => setPhraseOpen(true)}>
            Enter a recovery phrase
          </Button>
        </div>
        <p className="text-xs text-muted">
          This window’s library is “{app.profile}”. Open <span className="font-mono">?as=another</span> in a second tab to try two readers in one browser.
        </p>
      </section>

      <section className="mt-10 space-y-2" id="storage">
        <h2 className="font-serif text-2xl">Storage on this device</h2>
        <p className="text-sm text-muted">
          {app.estimate?.usage !== undefined && app.estimate.quota
            ? `${formatBytes(app.estimate.usage)} used of about ${formatBytes(app.estimate.quota)} this origin may store.`
            : "This browser did not report a quota."}{" "}
          {app.persisted === null ? "" : app.persisted ? "Persistent storage is on, so the browser should not evict this data under pressure." : "Persistent storage was not granted. The browser may clear this site if the device runs out of space, or after a stretch of not visiting (Safari)."}
        </p>
        <p className="text-sm text-muted">A backup file is the copy you can hold. The browser’s own storage is not a backup.</p>
      </section>

      {message ? <p className="mt-6 text-sm">{message}</p> : null}

      <Dialog open={phraseOpen} onOpenChange={setPhraseOpen}>
        <DialogContent title="Move a reading key here" description="The phrase replaces the key on this device. Notes already stored here stay.">
          <Label htmlFor="phrase">12-word recovery phrase</Label>
          <Input id="phrase" className="mt-2" value={phrase} onChange={(event) => setPhrase(event.target.value)} autoComplete="off" />
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                void app
                  .replaceIdentity(phrase)
                  .then(() => {
                    setPhraseOpen(false)
                    setPhrase("")
                    setMessage("Reading key replaced on this device.")
                  })
                  .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not use that phrase"))
              }}
            >
              Use this phrase
            </Button>
            <DialogClose className="rounded-full px-4 text-sm">Cancel</DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        {pending ? (
          <DialogContent
            title={pending.kind === "backup" ? "Restore this backup?" : "Use this reading key?"}
            description={
              pending.kind === "backup"
                ? "This replaces the shelf, place, marks, highlights, comments, and reading key on this device."
                : "This replaces only the reading key. The shelf and notes already here stay."
            }
          >
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  void (async () => {
                    if (pending.kind === "backup") {
                      await replaceFromBackup({
                        identity: pending.doc.identity,
                        settings: pending.doc.settings,
                        frequency: pending.doc.backup.frequency,
                        shelf: pending.doc.shelf,
                        progress: pending.doc.progress,
                        bookmarks: pending.doc.bookmarks,
                        highlights: pending.doc.highlights,
                        events: pending.doc.events,
                        exportedAt: pending.doc.exportedAt,
                      })
                      const dropped = pending.droppedEvents
                      sessionStorage.setItem("margem-import-note", dropped ? `${dropped} comments skipped` : "Restored")
                    } else {
                      await saveIdentity(pending.doc.identity)
                    }
                    location.reload()
                  })()
                }}
              >
                Restore
              </Button>
              <DialogClose className="rounded-full px-4 text-sm" onClick={() => setPending(null)}>
                Cancel
              </DialogClose>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </main>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
