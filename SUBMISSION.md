# Submission Checklist

Checked against the original assignment brief.

## Core features

- [x] **Document CRUD** — create, read, update, delete, owned by a user.
  `app/Http/Controllers/DocumentController.php`, `resources/js/pages/documents/{index,edit}.tsx`.
- [x] **Rich text editing** — bold, italic, underline, heading levels 2 & 3, bullet list, numbered list, via Tiptap.
  `resources/js/components/editor/{DocumentEditor,Toolbar}.tsx`. Content stored as HTML in `documents.content` (no custom JSON schema, no markdown conversion layer for storage).
- [x] **Sharing** — owner shares a document with another seeded user at `view` or `edit` permission; no roles beyond those two.
  `app/Http/Controllers/ShareController.php`, `app/Http/Requests/ShareDocumentRequest.php`, `resources/js/components/share-dialog.tsx`.
- [x] **File import** — `.txt` and `.md` only, 2MB max, no `.docx`.
  `app/Http/Controllers/ImportController.php`, `app/Http/Requests/ImportDocumentRequest.php`. `.txt` → HTML-escaped and wrapped in `<p>`; `.md` → converted via `league/commonmark`.
- [x] **Autosave** — edits save automatically without the Save button being the only path.
  `resources/js/hooks/use-autosave.ts`, debounced 1.5s, verified end-to-end (typed content, waited for the debounce, hard-refreshed the page, confirmed persistence) — not just code-reviewed.
- [x] **Feature test(s) on sharing permissions** — went beyond the "one meaningful test" bar with a full matrix:
  - `tests/Feature/DocumentPolicyTest.php` — owner / view-sharee / edit-sharee / unrelated user, crossed against view/update/share abilities (12 assertions).
  - `tests/Feature/DocumentSharingTest.php` — successful share, sharing a nonexistent email, owner sharing with themselves, re-sharing updates the existing permission instead of duplicating (4 tests).
  - `tests/Feature/DocumentImportTest.php` — markdown → HTML conversion, `.txt` escaping, disallowed extensions rejected (3 tests).

## Explicitly out of scope (confirmed not built, by design)

- [x] Real-time collaboration — no websockets, no CRDTs/OT.
- [x] OAuth beyond what the starter kit ships (Fortify's own auth only).
- [x] Version history / revisions.
- [x] `.docx` parsing.
- [x] Granular roles beyond `view`/`edit`.

## Test suite

```
50 tests, 173 assertions — all passing
```

Covers auth (from the starter kit), document CRUD, sharing/permissions, file import, and settings — run with `vendor/bin/phpunit` or `composer test` (which also runs Pint and PHPStan).

## Seeded demo data

Three users (`alice@test.com` / `bob@test.com` / `carol@test.com`, password `password`), three documents owned by Alice, one shared with Bob at `edit` permission. See `README.md` for details.

## Deployment

Prepared for Render (Dockerfile + `render.yaml`, Postgres in production) — see `README.md` for the live link once deployed, and `CLAUDE.md`'s Deployment section for what was verified and why (including a Railway attempt that got shelved when its trial credit expired).

## Known limitations

- Import supports `.txt`/`.md` only, as scoped — no `.docx`, no other rich-document formats.
- Autosave and the manual Save button both hit the same endpoint; there's no conflict resolution if the same document were edited from two tabs/sessions at once (out of scope — no real-time collaboration was required).
- No automated end-to-end/browser test suite; UI behavior (toolbar active states, autosave persistence, sharing flows) was verified manually via a real browser during development rather than committed as Playwright/Dusk tests.
