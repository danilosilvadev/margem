# Book file format

Each work is a UTF-8 JSON file at `content/<book-id>/book.json`. `npm run sync-content` copies it to `public/books/<book-id>.json` and rebuilds `public/catalog.json` without the paragraph bodies, so the library stays small and the full text downloads when a reader opens the book.

```json
{
  "id": "the-raven",
  "languages": ["en", "pt", "es"],
  "title": { "en": "The Raven", "pt": "O corvo", "es": "El cuervo" },
  "authors": [{ "name": "Edgar Allan Poe", "role": "Author", "years": "1809–1849" }],
  "year": 1845,
  "summary": "One paragraph for the library and the book page.",
  "rights": [
    {
      "lang": "en",
      "title": "The Raven",
      "credit": "Edgar Allan Poe",
      "edition": "The edition you transcribed.",
      "source": "https://example.com/the-edition",
      "rationale": "Why this specific text, not just the original story, is public domain."
    }
  ],
  "chapters": [
    {
      "id": "poem",
      "title": { "en": "The Raven", "pt": "O corvo", "es": "El cuervo" },
      "paragraphs": [
        { "id": "s01", "en": "First stanza…", "pt": "Primeira estrofe…", "es": "Primera estrofa…" }
      ]
    }
  ]
}
```

Rules:

- `id` values use lowercase letters, digits, and hyphens.
- A paragraph id is stable. Comments, bookmarks, and highlights point at it. Do not renumber after release.
- The same paragraph id is the alignment key. Put the English, Portuguese, and Spanish of one unit — a stanza, or a prose paragraph — in one object. Line breaks inside a string are kept.
- Every language listed in `languages` must be present and non-empty on every paragraph.
- Translations have their own copyright. `rights` must name the translator, the edition, a source URL, and why that translation is public domain. See `content/the-raven/SOURCES.md`.
