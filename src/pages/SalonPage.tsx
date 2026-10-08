import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { KIND } from "@shared/events"
import { authorById, salonById, workById } from "@shared/canon"
import { salonThreads } from "@shared/community"
import { displayNames } from "@shared/merge"
import { allEvents, type StoredEvent } from "@/lib/db"
import { useApp } from "@/state/AppProvider"
import { Button } from "@/components/ui/button"

export function SalonPage() {
  const { salonId = "" } = useParams()
  const salon = salonById(salonId)
  const { tick, ownerPubkey, publishCommunity } = useApp()
  const [events, setEvents] = useState<StoredEvent[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [pin, setPin] = useState(false)

  useEffect(() => {
    let cancel = false
    void allEvents().then((rows) => {
      if (!cancel) setEvents(rows)
    })
    return () => {
      cancel = true
    }
  }, [tick])

  if (!salon) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p>That salon is not on the list.</p>
        <Link to="/community" className="text-primary">Back to the community</Link>
      </main>
    )
  }

  const names = displayNames(events, ownerPubkey)
  const posts = salonThreads(events, ownerPubkey, salon.id)
  const roots = posts.filter((post) => !post.parentId)
  const replies = (id: string) => posts.filter((post) => post.parentId === id)

  return (
    <main data-testid="salon" className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <section className="rounded-2xl p-6 text-cream shadow-elevated" style={{ background: `linear-gradient(135deg, ${salon.color}, hsl(var(--wine-dark)))` }}>
        <Link to="/community" className="text-xs text-cream/70">Community</Link>
        <p className="mt-3 font-serif text-4xl">{salon.icon}</p>
        <h1 className="mt-2 font-serif text-4xl">{salon.name}</h1>
        <p className="mt-3 max-w-xl text-sm text-cream/80">{salon.long}</p>
      </section>

      <section>
        <h2 className="font-serif text-2xl">Works in the room</h2>
        <ul className="mt-2 space-y-1">
          {salon.workIds.map((id) => {
            const work = workById(id)
            return (
              <li key={id}>
                <Link className="text-primary" to={`/book/${work?.textId ?? id}`}>
                  {work?.title ?? id}
                </Link>
                <span className="text-sm text-muted-foreground"> · {authorById(work?.authorId ?? "")?.name}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Pinned questions</h2>
        <p className="text-sm text-muted-foreground">These are not posts by a person. They are the room’s questions.</p>
        {salon.prompts.map((prompt) => (
          <article key={prompt.id} className="rounded-xl border border-gold/40 bg-card p-4" data-testid="salon-prompt">
            <p className="text-xs tracking-[0.14em] text-gold uppercase">Pinned</p>
            <h3 className="font-serif text-xl">{prompt.title}</h3>
            <p className="mt-1 text-sm">{prompt.body}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Signed threads</h2>
        <form
          className="space-y-2 rounded-xl border border-border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!body.trim()) return
            const tags = [["s", salon.id]]
            const bookId = salon.workIds[0]
            if (bookId) tags.push(["b", bookId])
            if (replyTo) tags.push(["e", replyTo])
            if (pin && !replyTo) tags.push(["pin", "1"])
            void publishCommunity({
              kind: KIND.salonPost,
              tags,
              content: JSON.stringify({ title: title.trim(), body: body.trim() }),
            }).then(() => {
              setTitle("")
              setBody("")
              setReplyTo(null)
              setPin(false)
            })
          }}
        >
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={replyTo ? "Reply" : "Thread title"} className="w-full rounded-md border border-border bg-background px-3 py-2" />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write in your own name" className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2" />
          {replyTo ? <p className="text-xs text-muted-foreground">Replying. <button type="button" className="underline" onClick={() => setReplyTo(null)}>Cancel</button></p> : null}
          {!replyTo ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pin} onChange={(event) => setPin(event.target.checked)} />
              Pin this thread
            </label>
          ) : null}
          <Button type="submit">Sign and post</Button>
        </form>
        {roots.length === 0 ? <p className="text-sm text-muted-foreground">No signed thread yet.</p> : null}
        {roots.map((thread) => (
          <article key={thread.id} className="rounded-xl border border-border bg-card p-4" data-testid="salon-thread">
            {thread.pinned ? <p className="text-xs tracking-[0.14em] text-primary uppercase">Pinned by the author</p> : null}
            {thread.title ? <h3 className="font-serif text-xl">{thread.title}</h3> : null}
            <p className="mt-1 whitespace-pre-wrap text-sm">{thread.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">{names.get(thread.pubkey) ?? "A reader"}</p>
            <button type="button" className="mt-2 text-xs text-primary" onClick={() => setReplyTo(thread.id)}>
              Reply
            </button>
            <ul className="mt-3 space-y-2 border-l border-border pl-3">
              {replies(thread.id).map((reply) => (
                <li key={reply.id}>
                  <p className="text-sm">{reply.body}</p>
                  <p className="text-xs text-muted-foreground">{names.get(reply.pubkey) ?? "A reader"}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  )
}
