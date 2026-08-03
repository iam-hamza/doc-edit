# Submission

## Quick links

- **Google Drive folder (all materials):** `<REPLACE_WITH_DRIVE_FOLDER_LINK>`
- **GitHub repository:** https://github.com/iam-hamza/doc-edit
- **Live deployment:** Not completed — see "Deployment status" below for why, and what's ready to go instead.

## Test credentials

The seeder creates three accounts, all with the same password, so a reviewer can log in as any of them to exercise both sides of a sharing relationship:

| Name  | Email             | Password   | Notes |
|-------|-------------------|------------|-------|
| Alice | alice@test.com    | `password` | Owns 3 documents; has shared "Project Roadmap" with Bob at **edit** permission |
| Bob   | bob@test.com      | `password` | Sees "Project Roadmap" under "Shared with me", can edit it |
| Carol | carol@test.com    | `password` | No documents, nothing shared — useful for confirming the no-access case |

To review the sharing flow end to end: log in as Alice, open any document, use the Share button to invite `carol@test.com` at `view` permission, then log in as Carol and confirm it appears read-only under "Shared with me."

## Run locally

```bash
composer install
npm install

cp .env.example .env
php artisan key:generate

touch database/database.sqlite
php artisan migrate --seed

composer dev   # runs the PHP server, queue listener, log tailer, and Vite together
```

Visit `http://localhost:8000`. Full details, including the two seeded-data specifics above, are in `README.md`.

## Deployment status

**Not deployed.** The original plan was Railway (fully prepared: `railway.json`, Postgres wiring, verified locally). Railway's free trial credit ran out partway through the project, so I switched the deployment target to Render instead — this required a real Dockerfile (Render has no native PHP runtime, unlike Railway's Nixpacks auto-detection) and a `render.yaml` Blueprint provisioning a web service plus a free Postgres database.

That Render setup is **built and verified locally** — I built the actual Docker image, ran it against a real Postgres container on a Docker network (mirroring how Render wires a service to its managed database), and drove it through a real browser session (register, login, create/edit a document, autosave, hard refresh) with zero errors. What's left is purely the manual dashboard steps on render.com (connect the repo, approve the Blueprint, paste in `APP_KEY`) — I ran out of time to complete those before this submission. Given the app runs correctly locally and the deploy path is verified end-to-end short of the actual click-through, I'd estimate 15–30 minutes to finish this.

## Feature status

### Working

- Document CRUD (create, edit, delete), owned per-user.
- Rich text editing via Tiptap: bold, italic, underline, headings (h2/h3), bullet and numbered lists, with a toolbar that correctly reflects active formatting at the cursor.
- Sharing with `view`/`edit` permission, enforced by a single `DocumentPolicy` — verified both by an automated test matrix and by manually hitting the update route directly as a view-only user (blocked with a 403).
- File import restricted to `.txt`/`.md` (2MB max), with a clear validation error naming the allowed types for anything else.
- Autosave — debounced background save that doesn't reset editor focus/cursor, verified by editing, waiting past the debounce with no manual save click, then hard-refreshing and confirming the content persisted exactly.
- 50 automated tests (173 assertions) covering auth, document CRUD, sharing permissions, and file import.

### Incomplete

- **Live deployment** (see above — configuration is complete and locally verified, the dashboard click-through itself isn't done).
- No automated browser/E2E test suite — UI behavior (toolbar states, autosave persistence, sharing flows) was verified manually during development rather than committed as Playwright/Dusk tests.

### What I'd build next with another 2–4 hours

1. Finish the Render deployment (~15–30 min) and swap the placeholder link above for the real one.
2. A small Playwright smoke-test suite covering the flows that were only manually verified (editor formatting, sharing, autosave), so regressions get caught automatically rather than by re-testing by hand.
3. Search/filter on the documents list — trivial with the current data shape, and the first thing that'd start to matter once a user has more than a handful of documents.
4. A couple more Tiptap extensions (links, and possibly a simple image upload) — the current formatting set covers what was asked for, but links in particular feel like a near-term gap for a real editor.
5. Basic rate limiting on the import and share endpoints, which don't currently have any beyond Laravel's defaults.

## Explicitly out of scope (by design, not oversights)

- Real-time collaboration — no websockets, no CRDTs/OT.
- OAuth beyond what the starter kit ships (Fortify's own auth only).
- Version history / revisions.
- `.docx` parsing.
- Granular roles beyond `view`/`edit`.

## Deliverables checklist

- [x] **Document CRUD** — `app/Http/Controllers/DocumentController.php`, `resources/js/pages/documents/{index,edit}.tsx`.
- [x] **Rich text editing** (bold/italic/underline/headings/lists via Tiptap) — `resources/js/components/editor/{DocumentEditor,Toolbar}.tsx`. Content stored as HTML in `documents.content` (no custom JSON schema, no markdown conversion layer for storage).
- [x] **Sharing** (view/edit permission) — `app/Http/Controllers/ShareController.php`, `app/Http/Requests/ShareDocumentRequest.php`, `resources/js/components/share-dialog.tsx`.
- [x] **File import** (.txt/.md only, no .docx) — `app/Http/Controllers/ImportController.php`, `app/Http/Requests/ImportDocumentRequest.php`.
- [x] **Autosave** — `resources/js/hooks/use-autosave.ts`.
- [x] **Feature test(s) on sharing permissions** — went beyond the "one meaningful test" bar with a full matrix:
  - `tests/Feature/DocumentPolicyTest.php` — owner / view-sharee / edit-sharee / unrelated user, crossed against view/update/share abilities (12 assertions).
  - `tests/Feature/DocumentSharingTest.php` — successful share, sharing a nonexistent email, owner sharing with themselves, re-sharing updates the existing permission instead of duplicating (4 tests).
  - `tests/Feature/DocumentImportTest.php` — markdown → HTML conversion, `.txt` escaping, disallowed extensions rejected (3 tests).

## Test suite

```
50 tests, 173 assertions — all passing
```

Run with `vendor/bin/phpunit` or `composer test` (which also runs Pint and PHPStan).

## Known limitations

- Import supports `.txt`/`.md` only, as scoped — no `.docx`, no other rich-document formats.
- Autosave and the manual Save button both hit the same endpoint; there's no conflict resolution if the same document were edited from two tabs/sessions at once (out of scope — no real-time collaboration was required).
- No live deployment yet (see "Deployment status").

See `ARCHITECTURE.md` for the reasoning behind key technical decisions, and `CLAUDE.md` for detailed implementation conventions and gotchas encountered along the way.
