# Margem

Read public-domain classics in Portuguese, Spanish, and English, side by side. No account, no payment, no server-side database. The page you open is the whole product: a static site, plus one small relay process you can leave running so comments still sync when you are the only person online.

The name lives in [`shared/brand.ts`](shared/brand.ts). The installable app reads it from there.

## Run it

```bash
npm install
npm run dev          # site at http://127.0.0.1:41731
npm run relay        # comment relay at ws://127.0.0.1:41732
```

In another terminal, the relay prints a moderator public key and writes `relay-data/`. Leave that process running.

```bash
npm test             # storage, signatures, merge, backups, relay
npm run build        # static files in dist/
npm run preview      # serve the built PWA
npm run measure      # print the storage figures below
```

Open the site, then Settings if you want a display name. To try two readers in one browser, open a second tab at `http://127.0.0.1:41731/?as=second`. Each tab gets its own library and reading key. Comments meet in the relay.

## Stack, and why

| Piece | Choice | Why |
| --- | --- | --- |
| Site | Vite, React, TypeScript, Tailwind | The reader is an app (columns, selection, sync), not a set of documents. A static Vite build can be hosted anywhere. React islands in Astro would split one reading session across frameworks for no gain. |
| Controls | shadcn-style Radix primitives | Dialogs, sheets, and buttons, themed with the reading palette. |
| Books | JSON in `content/`, copied to `public/books/` | Plain files. Add a work by adding a folder. See [content/FORMAT.md](content/FORMAT.md). |
| Local data | IndexedDB (`idb`) | Progress, shelf, bookmarks, highlights, keys, and comments. It works in Chrome, Firefox, and Safari, including iOS. SQLite-WASM on OPFS is faster for huge SQL and worse here: a WASM blob, a younger API, and past Safari bugs, for a dataset that is a few indexed lists. |
| Identity | Ed25519 (`@noble/ed25519`) and a 12-word BIP-39 phrase (`@scure/bip39`) | The public key is the user id. Nostr uses secp256k1 so it can join that network; that pulls in a larger stack and a protocol we would have to keep up with. These comments only need to verify. Ed25519 is smaller and does not depend on WebCrypto, which still does not expose it everywhere. |
| Sync | A tiny WebSocket relay, plus WebRTC when two readers of the same book are both online | The relay is one Node process and one JSONL file. It checks signatures, stores events, and fans them out by book and chapter. It also forwards WebRTC signaling. Direct links are a bonus path. The relay remains the copy that is there when the other person has closed the tab. |
| Offline | Service worker (vite-plugin-pwa) | The shell, fonts, and catalog are precached. Each book is fetched when opened and then kept by the Cache API and IndexedDB. |

The reader shows “You are offline” when the browser fires `offline`, or when a request to `/__reachability` fails. That path is not precached, so a CacheFirst worker cannot answer it from the book cache. Chromium can leave `navigator.onLine` true while requests are blocked; the probe is what the banner follows in that case. A book already on the device still opens.

Tradeoff worth sitting with: this relay is not a public Nostr relay. A reader cannot point a generic Nostr client at it. In return, Dan runs one process, filters are just book and chapter, and the moderator key is the key that process generated.

## The look, and the pages around the reader

The palette is the one from O Cenáculo: wine, cream, gold, Playfair Display for titles, DM Sans for the rest. Both fonts are self-hosted so the installed app still opens offline. Light, sepia, and dark still switch the same tokens.

Explore is the front page. The shelf is this browser’s own progress, marks, and quotes. The map, the journey, the family tree, and the opening-lines game are scored on this device (`localStorage`, key `margem-games`). The facts they use live in [`shared/canon.ts`](shared/canon.ts) and are explained in [content/CANON.md](content/CANON.md). Only The Raven has a parallel text. The other works are metadata, with the public-domain note written on each one.

Community is signed events, not an account. Reading rooms, salon threads, and marginalia use the reading key. A letter uses a one-time key that this browser does not keep. The relay accepts that mismatch only for letters, and still checks the signature. The owner’s blocklist hides a key or a single event everywhere, including there. “Trending this week” counts events already synced to this browser.

Left in O Cenáculo, and not brought over: accounts, payments, the store, cohorts with mentors, the calendar of a class, and the professor, mentor, and admin desks.

## What a reader can do

- Library and a book page, with the public-domain note for each language.
- Parallel text, stanza by stanza. On a wide screen, one, two, or three columns, and a language per column. On a narrow screen, a stacked view or one language at a time, changed by the language buttons or a horizontal swipe.
- Light, sepia, and dark, and a font size.
- Chapter list, previous and next, and the place you stopped, restored on return.
- Bookmarks and highlights (select text, then Highlight).
- Comment threads per stanza and per chapter. Each comment is signed. A reply points at the parent.
- A shelf kept on this device.

## Comments, the relay, and moderation

An event is a Nostr-shaped object signed with Ed25519:

```json
{ "id": "…", "pubkey": "…", "created_at": 0, "kind": 1, "tags": [["b","the-raven"],["c","poem"],["p","s01"]], "content": "…", "sig": "…" }
```

`id` is the hex SHA-256 of the canonical JSON array `[0, pubkey, created_at, kind, tags, content]`. The signature covers that same message. Kinds: `0` display name, `1` comment, `5` deletion (only the author can hide their own note), `30001` blocklist.

The browser subscribes to the open chapter, plus the small global streams for names and the blocklist. It does not download comments for books it has not opened.

Readers who are both subscribed to the same book exchange WebRTC signaling through the relay and, when the browsers can punch a path, a data channel. Signaling uses host candidates and, unless `VITE_STUN_URL` is set empty, `stun:stun.l.google.com:19302`. Direct delivery is labeled **Direct** on the note. If the channel never opens, the note still arrives through the relay and is labeled **Relay**. A note written while the relay is down stays **On this device** and is sent when the socket returns.

The relay binds `RELAY_HOST` (default `0.0.0.0`) on `RELAY_PORT` (default `41732`). Admin HTTP stays on `127.0.0.1:41733` only.

```bash
npm run relay:block -- show
npm run relay:block -- add-pubkey <64 hex chars>
npm run relay:block -- remove-pubkey <64 hex chars>
npm run relay:block -- add-event <event id>
npm run relay:block -- remove-event <event id>
```

That writes a new blocklist event signed by `relay-data/owner.json` and broadcasts it. Clients hide matching authors and event ids. Keep `owner.json`. If it is replaced, old blocklists stop counting, because they were signed by the previous key. `relay-data/admin.token` is the bearer token for the admin port. `relay-data/events.jsonl` is the log.

A page served over HTTPS cannot call `ws://`. Put a TLS proxy in front of the relay and set the relay address in Settings to `wss://…`. Local `http://127.0.0.1` can use `ws://127.0.0.1:41732`, which is the default (`VITE_RELAY_URL` overrides it at build time).

## Backups are a choice

Nothing in this app writes a backup file by itself. Not on a timer, and not through the File System Access API, even on desktop Chromium where a persisted file handle can exist.

What browsers actually allow:

- **File System Access** (`showSaveFilePicker`, and a handle stored in IndexedDB) is Chromium on desktop. Using a saved handle later still wants a user gesture, and it does not run after the tab is closed. Firefox, Safari, and iOS do not offer that picker.
- **Periodic Background Sync** is not a place to save a file, and it is not available on Safari or Firefox.
- **`navigator.storage.persist()`** asks the browser to avoid evicting the site’s IndexedDB and caches. Margem requests it on launch and reports the answer in Settings. That is not a copy you can hold in your hand.
- **Origin Private File System** is still inside the origin. If the browser evicts the site, those files go too.

So the backup is a button. The prompt does not appear on the first visit. After that, at most once a day, and only if something changed since the last backup, a small corner note asks “Back up this browser?” with **Back up now** and **Later**. Later waits out the interval. Settings can switch the reminder to daily, every 3 days, weekly, or off. Off does not hide **Back up now**.

**Back up now** downloads a JSON file on a desktop browser. On a phone (or any coarse pointer where the browser can share files) it opens the system share sheet, so the file can go to Files, Drive, or a message. Cancelling the sheet does not count as a backup. Settings shows the last backup time. Restore reads that file back, checks the recovery phrase against the key, drops any comment whose signature fails, and replaces the local library. A separate identity file, or the 12-word phrase, moves the reading key without the notes.

The phrase is the BIP-39 mnemonic. The Ed25519 seed is the first 32 bytes of the BIP-39 seed (empty passphrase). Anyone with the phrase can post as that reader. The secret key sits in IndexedDB. A script injected into this origin could read it. The site loads no third-party JavaScript.

## Storage numbers

Measured with `npm run measure` on this sample (The Raven, 18 stanzas, three languages):

| | Bytes |
| --- | ---: |
| `content/the-raven/book.json` | 24,370 |
| Same file, gzip | 10,330 |
| One signed comment, JSON (a short margin note, ~180 characters, plus key, id, and signature) | 540 |
| That comment, gzip | 397 |

IndexedDB stores the records, not the gzip. Plan on about the JSON size, plus a small index (book, chapter, pending). Gzip only matters on the wire and in the HTTP cache.

| Reader | Books cached | Comments stored | About |
| --- | ---: | ---: | --- |
| Typical | 10 × this poem | 1,000 | 0.8 MB |
| Heavy | 100 × this poem | 100,000 | 56 MB |

A novel is a different book size: roughly the plain text of each language, plus JSON. Comments do not grow with the book. Fifty-six megabytes is still a small fraction of the quotas below. The app shell and self-hosted fonts precache to about 751 KiB. The book file is not in that precache; it downloads the first time someone opens it.

Quotas and eviction, from [MDN “Storage quotas and eviction criteria”](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) and the [WebKit storage policy notes](https://webkit.org/blog/14403/updates-to-storage-policy/) (checked October 2026):

- **Chrome and other Chromium browsers.** An origin may use up to about 60% of the disk, in both best-effort and persistent mode. The browser as a whole stays under about 80% of the disk. Under storage pressure, best-effort origins are evicted least-recently-used, the whole origin at once. `persist()` is granted or denied from engagement heuristics, with no prompt. An installed PWA does not get a larger quota number; it is less likely to be the least-recently-used origin, and more likely to be granted persistent storage.
- **Firefox.** Best-effort is the smaller of 10% of the disk and a 10 GiB group limit for the site. Persistent storage, which Firefox asks the user about, may use 50% of the disk, capped at 8 TiB, and is not under the group limit. Eviction under pressure skips persistent origins and otherwise uses least-recently-used.
- **Safari, and WebKit on iOS.** Since Safari 17 / iOS 17, a browser origin may use about 60% of the disk. An in-app WebView is closer to 15%, unless the site was saved to the Home Screen or the Dock, in which case it gets the browser quota. There is also an overall cap (about 80% of disk for browsers, 20% for other WebKit apps). With tracking prevention on, Safari deletes script-written storage (IndexedDB, Cache API, the service worker) after seven days of browser use without a click or tap on that origin. Cookies set by a server are exempt; this site does not use them. An installed Home Screen web app is the case WebKit treats as a reason to grant persistent storage, and the seven-day cap is aimed at sites that are not being used, not at an icon the person opens. Older Safari builds started at about 1 GiB and then asked permission to grow.
- **Private windows** drop the origin’s data when the private session ends.

`navigator.storage.estimate()` in Settings is the browser’s own report for this origin. It is an estimate.

## The sample text

[The Raven](content/the-raven/SOURCES.md), 18 aligned stanzas:

- English: Poe, *The Raven and Other Poems*, Wiley and Putnam, 1845.
- Portuguese: Machado de Assis, in *Poesias completas*, Garnier, 1902 (the translation is from 1883).
- Spanish: Juan Antonio Pérez Bonalde, 1887, in the lineation of the 1919 reprint transcribed on Wikisource.

Each language has its own public-domain reason in that file. A later translation is not assumed to be free just because the original poem is.

## Add a book

Follow [content/FORMAT.md](content/FORMAT.md). Put `content/<id>/book.json` in place, run `npm run sync-content`, and the library picks it up. Paragraph ids are what bookmarks and comments point at. Do not renumber them after anyone has written in the margin.

## Limits that are the browser’s, not the app’s

- Backups never happen in the background. If the reminder is dismissed or turned off, and the browser later evicts the origin, the notes are gone unless a file was saved.
- Safari can wipe an unused site after seven days. Installing to the Home Screen, and the persistent-storage grant, are the mitigations. They are not a guarantee against the reader pressing “clear website data.”
- Direct reader-to-reader delivery needs a network path. Two browsers on one machine usually manage it. Two phones on different networks might not, even with STUN. The relay still carries the comment.
- The reading key never leaves the device except inside a backup or identity file the reader chose to export.
