import { readFile } from "node:fs/promises"
import { gzipSync } from "node:zlib"
import { createIdentity } from "../shared/identity.ts"
import { KIND, signEvent } from "../shared/events.ts"

const raw = await readFile("content/the-raven/book.json")
const gzip = gzipSync(raw)
const identity = await createIdentity()
const event = await signEvent(
  {
    pubkey: identity.publicKey,
    created_at: 1_700_000_000,
    kind: KIND.comment,
    tags: [
      ["b", "the-raven"],
      ["c", "poem"],
      ["p", "s01"],
    ],
    content:
      "A margin note of about two hundred characters, which is a comfortable length for a remark on one stanza rather than an essay. The signature travels with it.",
  },
  identity.secretKey,
)
const comment = Buffer.from(JSON.stringify(event))
const commentGzip = gzipSync(comment)
const book = raw.length
const report = {
  bookRawBytes: book,
  bookGzipBytes: gzip.length,
  commentJsonBytes: comment.length,
  commentGzipBytes: commentGzip.length,
  typical10Books1kComments: 10 * book + 1000 * comment.length,
  heavy100Books100kComments: 100 * book + 100_000 * comment.length,
}
console.log(JSON.stringify(report, null, 2))
