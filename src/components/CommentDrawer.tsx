import { useState } from "react"
import { KIND, MAX_CONTENT_CHARS, tagValue, type SignedEvent } from "@shared/events"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatCommentTime, shortKey } from "@/lib/utils"
import { useApp, useChapterThread } from "@/state/AppProvider"
import type { StoredEvent } from "@/lib/db"

export function CommentDrawer({
  open,
  onOpenChange,
  bookId,
  chapterId,
  paragraphId,
  heading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookId: string
  chapterId: string
  paragraphId: string | null
  heading: string
}) {
  const { identity, publishComment, deleteComment, notice, clearNotice, syncStatus } = useApp()
  const { comments, names, events } = useChapterThread(bookId, chapterId)
  const [tab, setTab] = useState<"stanza" | "chapter">(paragraphId ? "stanza" : "chapter")
  const [text, setText] = useState("")
  const [replyTo, setReplyTo] = useState<StoredEvent | null>(null)
  const [busy, setBusy] = useState(false)

  const stored = new Map(events.map((event) => [event.id, event]))
  const visible = comments.filter((event) => {
    const paragraph = tagValue(event, "p")
    if (tab === "chapter") return !paragraph
    return paragraph === paragraphId
  })

  async function submit() {
    const content = text.trim()
    if (!content || busy) return
    setBusy(true)
    try {
      await publishComment({
        bookId,
        chapterId,
        paragraphId: tab === "stanza" ? (paragraphId ?? undefined) : undefined,
        content,
        replyTo: replyTo?.id,
      })
      setText("")
      setReplyTo(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={heading}
        description={syncStatus === "open" ? "Signed comments sync with other readers of this chapter." : "Saved on this device until the relay is reachable."}
      >
        <div className="mb-4 flex gap-2">
          {paragraphId ? (
            <Button size="sm" variant={tab === "stanza" ? "default" : "line"} onClick={() => setTab("stanza")}>
              This stanza
            </Button>
          ) : null}
          <Button size="sm" variant={tab === "chapter" ? "default" : "line"} onClick={() => setTab("chapter")}>
            This chapter
          </Button>
        </div>
        {notice ? (
          <p className="mb-3 rounded-lg bg-accent-soft px-3 py-2 text-sm">
            {notice}{" "}
            <button className="underline" onClick={clearNotice}>
              Dismiss
            </button>
          </p>
        ) : null}
        <div data-testid="comment-list" className="space-y-4">
          {visible.length === 0 ? (
            <p className="text-sm text-muted">Be the first to write in this margin. No account — your reading key signs the note.</p>
          ) : (
            visible.map((event) => {
              const row = stored.get(event.id)
              const parentId = tagValue(event, "e")
              const parent = parentId ? comments.find((item) => item.id === parentId) : undefined
              return (
                <article key={event.id} className="border-b border-line pb-3" data-testid="comment">
                  <header className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted">
                    <span className="font-medium text-ink">{names.get(event.pubkey) || `Reader ${shortKey(event.pubkey)}`}</span>
                    <span>
                      {formatCommentTime(event.created_at)} · {transportLabel(row)}
                    </span>
                  </header>
                  {parent ? <p className="mt-1 text-xs text-muted">Replying to “{parent.content.slice(0, 80)}”</p> : null}
                  <p className="mt-1 whitespace-pre-wrap text-sm">{event.content}</p>
                  <div className="mt-2 flex gap-3 text-xs">
                    <button className="text-muted hover:text-ink" onClick={() => setReplyTo(event)}>
                      Reply
                    </button>
                    {event.pubkey === identity.publicKey ? (
                      <button className="text-muted hover:text-accent" onClick={() => void deleteComment(event)}>
                        Remove
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })
          )}
        </div>
        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          {replyTo ? (
            <p className="text-xs text-muted">
              Replying to {names.get(replyTo.pubkey) || "a reader"}.{" "}
              <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </p>
          ) : null}
          <Textarea
            data-testid="comment-input"
            value={text}
            maxLength={MAX_CONTENT_CHARS}
            placeholder={tab === "stanza" ? "A note on this stanza" : "A note on this chapter"}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">Signed as {names.get(identity.publicKey) || identity.displayName || shortKey(identity.publicKey)}</span>
            <Button data-testid="comment-submit" type="submit" disabled={busy || !text.trim()}>
              Post
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function transportLabel(event: StoredEvent | undefined): string {
  if (!event || event.pending || event.via === "local") return "On this device"
  if (event.via === "direct") return "Direct"
  return "Relay"
}

export function countFor(events: SignedEvent[], paragraphId: string): number {
  return events.filter((event) => event.kind === KIND.comment && tagValue(event, "p") === paragraphId).length
}
