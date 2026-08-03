# Document Editor (Google-Docs-lite) — Take-Home Assignment

A lightweight collaborative document editor built with Laravel + Inertia + React.
This file is the source of truth for scope, architecture, and conventions.
Update it whenever a new convention is established so future sessions stay consistent.

## Stack

- Laravel (latest) + the official **Laravel React starter kit**: React 19, TypeScript,
  Tailwind, shadcn/ui, Inertia, Fortify auth.
- Tiptap **v3** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`)
  for rich text editing — see the Tiptap v3 gotchas note under Frontend UI conventions,
  npm installed v3 which behaves differently from the v2 examples all over the internet.
- `league/commonmark` for `.md` → HTML conversion on import.
- SQLite/MySQL (whichever the starter kit defaults to) — no special DB requirements.
- Pest/PHPUnit for tests (use whichever the starter kit ships with).

## Core Features (in scope)

1. **Document CRUD** — create, read, update, delete documents owned by a user.
2. **Rich text editing** via Tiptap: bold, italic, underline, headings, lists.
   Content is stored as HTML directly in `documents.content` (no custom JSON schema,
   no markdown conversion layer).
3. **Sharing** — a document owner can share a document with other seeded users,
   granting either `view` or `edit` permission. No granular roles beyond these two.
4. **File import** — `.txt` and `.md` only. No `.docx` parsing. Imported content is
   converted to HTML (or wrapped in `<p>` tags) before being stored in `content`.
5. **Autosave** — edits save automatically without an explicit "Save" button click
   being the only path.
6. **One meaningful feature test** covering sharing permissions (e.g. a user with
   `view` cannot edit/save; a user with `edit` can; a user with no share cannot
   access the document at all).

## Explicitly Out of Scope

- Real-time collaboration (no websockets, no operational transforms/CRDTs).
- OAuth beyond whatever the starter kit includes out of the box.
- Version history / revisions.
- `.docx` parsing/import.
- Granular roles beyond `view` / `edit` (no admin/comment-only/etc.).

Do not build toward these "for future-proofing." If a design decision would only
pay off if one of these were added later, prefer the simpler option that ignores it.

## Architecture

Standard Laravel MVC. Deliberately **no repository layer, no service layer**.
Controllers talk to Eloquent models directly. Keep it thin and boring — this is a
take-home assignment, not a production system meant to scale in complexity.

- **Authorization**: a single `DocumentPolicy` handles all authorization checks
  (view/update/delete/share). Do not create per-action policy classes or split
  authorization logic into helpers/traits — everything sharing-related funnels
  through this one policy.
- **Content storage**: Tiptap's HTML output is stored directly in the
  `documents.content` column (`text`/`longtext`). No intermediate JSON document
  model, no serialization layer.
- **Frontend state**: Inertia page props ARE the state. No axios, no Redux, no
  React Context for server data. Mutations go through Inertia's
  `router.post` / `router.put` / `router.delete` (or the `useForm` helper).
  Local-only UI state (e.g. "is the share dialog open") can use `useState`.

## Conventions

_(Log naming, folder structure, and prop shapes here as they're established during
implementation — keep entries short and current, remove if they become stale.)_

### Naming
- Migrations/models use Laravel defaults: `documents` / `Document`,
  `document_shares` / `DocumentShare`. FK columns are explicit and don't always
  match the default Eloquent guess — `owner_id` on `documents` (not `user_id`),
  so `Document::owner()` passes the FK explicitly:
  `belongsTo(User::class, 'owner_id')`.
- This starter kit's Laravel version uses PHP attributes instead of legacy
  model properties: `#[Fillable([...])]` and `#[Hidden([...])]` above the class,
  not `protected $fillable` / `protected $hidden`. Follow this on every new
  model (see `app/Models/User.php`, `Document.php`, `DocumentShare.php`).
- FK columns (`owner_id`, `document_id`, `user_id`) are deliberately left out of
  `#[Fillable]` — create related rows through the relation
  (`$user->documents()->create([...])`, `$document->shares()->create([...])`)
  so the FK is set by the relation, not mass assignment.

### Folder structure
- Standard starter-kit layout: `app/Models`, `app/Http/Controllers`,
  `app/Policies`, `app/Http/Requests` (flat, not namespaced per-controller —
  `StoreDocumentRequest`/`UpdateDocumentRequest` live directly under
  `Requests/`, unlike the starter kit's own `Requests/Settings/*` which mirrors
  its `Controllers/Settings/*` nesting), `database/migrations`,
  `resources/js/pages`, `resources/js/components`. No `app/Repositories` or
  `app/Services` — per the no-repository/no-service-layer decision, controllers
  talk to Eloquent models directly.
- `DocumentPolicy` is registered explicitly via `Gate::policy(Document::class,
  DocumentPolicy::class)` in `AppServiceProvider::boot()`, in addition to
  relying on Laravel's naming-convention auto-discovery — belt and suspenders,
  confirmed working via `Gate::getPolicyFor(Document::class)`.
- Routes: `Route::resource('documents', DocumentController::class)->only([...])`
  inside the existing `['auth', 'verified']` group in `routes/web.php`. Only
  `index, store, edit, update, destroy` — no `show` (edit doubles as the view)
  and no `create` (creation happens via a dialog on the index page, not a
  separate page).
- Controller authorization pattern: `Gate::authorize('ability', $model)` (not
  the `AuthorizesRequests` trait / `$this->authorize()`) since the base
  `Controller` class in this Laravel version doesn't include that trait by
  default and we didn't add it.
- Success feedback uses the starter kit's existing flash-toast convention:
  `Inertia::flash('toast', ['type' => 'success', 'message' => '...'])` in the
  controller, picked up automatically by the global `<Toaster />` — don't call
  `toast()` client-side for server-driven mutations.
- Sharing lives in its own single-action `ShareController@store`
  (`POST /documents/{document}/share`, named `documents.share`), not folded
  into `DocumentController` — sharing is a distinct concern (its own Form
  Request, its own "can't share with the owner" validation rule) even though
  it operates on the same model.
- `ShareDocumentRequest` uses `exists:users,email` + a `messages()` override
  (not a custom closure) for the "no user found" case, and a closure rule for
  the "can't share with the document's own owner" check — the closure reads
  the already-bound `Document` off `$this->route('document')` (route model
  binding resolves before FormRequest validation runs, so this is safe) and
  needs a `/** @var Document $document */` hint for PHPStan since
  `route()` is typed `mixed`.
- **Wayfinder gotcha**: `php artisan wayfinder:generate` (no flags) drops the
  `.form` variant from every action, even though `vite.config.ts` has
  `wayfinder({ formVariants: true })`. Always run it as
  `php artisan wayfinder:generate --with-form` when regenerating by hand,
  or the `<Form {...Controller.action.form()}>` pattern breaks across the
  *entire* app (caught via `tsc --noEmit`, not just in the file you touched).
  Note `composer require` also reruns wayfinder generation as part of the
  starter kit's `install:features` post-install hook — that path apparently
  respects `vite.config.ts`'s `formVariants: true` correctly (verified after
  adding `league/commonmark`), so it's specifically the bare
  `php artisan wayfinder:generate` CLI invocation you need to remember the
  flag for, not every regeneration path.
- File import (`ImportController@store`, `POST /documents/import`, named
  `documents.import`) is also its own controller, same reasoning as
  `ShareController` — a distinct concern from CRUD even though it ends by
  creating a `Document`. `ImportDocumentRequest` validates the extension via
  a closure reading `getClientOriginalExtension()` directly (not Laravel's
  `mimes:` rule) — MIME-sniffing-based rules can misdetect plain-text `.md`
  files, so we deliberately check the extension string instead. `.txt` → the
  raw content is `e()`-escaped and wrapped in one `<p>`; `.md` → run through
  `league/commonmark`'s `CommonMarkConverter`. Document title = the uploaded
  filename without its extension (`pathinfo($name, PATHINFO_FILENAME)`).

### Data model (established)
- `documents`: `id`, `owner_id` (FK → `users`, cascade delete), `title`,
  `content` (longtext, nullable — Tiptap HTML), timestamps.
- `document_shares`: `id`, `document_id` (FK → `documents`, cascade delete),
  `user_id` (FK → `users`, cascade delete), `permission` (enum, see below),
  timestamps. Unique on `(document_id, user_id)` — one share row per user per
  document, enforced at the DB level, not just in application code.
- Relations: `Document::owner()` (belongsTo User), `Document::shares()`
  (hasMany DocumentShare), `DocumentShare::document()` / `::user()`
  (belongsTo), `User::documents()` (hasMany Document via `owner_id`),
  `User::sharedDocuments()` (hasMany DocumentShare — i.e. share *records* for
  that user, not the shared Document models directly; go through
  `->sharedDocuments->pluck('document')` or a join if you need the actual
  documents shared with a user).

### Frontend UI conventions
- Sidebar nav items live in `resources/js/components/app-sidebar.tsx`
  (`mainNavItems` array), using Wayfinder-generated route helpers
  (`import documents from '@/routes/documents'`, `documents.index()`) and
  `lucide-react` icons — never hardcode a URL string when a Wayfinder helper
  exists for it.
- Added `resources/js/components/ui/textarea.tsx` (standard shadcn textarea —
  wasn't in the starter kit by default). `table`, `alert-dialog`, `tabs`, and
  `form` are still not installed; nothing has needed them yet.
- Destructive actions (delete document) use a `Dialog` confirmation, modeled
  directly on the starter kit's own `passkey-item.tsx` pattern: row content
  (icon + title) as one flex child, the delete button + `Dialog` as a sibling
  — never nest the delete button inside the row's `<Link>`, since browsers
  don't allow interactive elements nested in an anchor.
- Reusable list-row component: `resources/js/components/document-row.tsx`
  (used for both owned and shared documents; `permission` prop shows a
  `Badge`, `canDelete` prop shows/hides the delete `Dialog`).
- Document creation is a `Dialog` + `useForm` (`resources/js/components/
  new-document-dialog.tsx`), not a dedicated `/documents/create` page — matches
  the no-`create`-route decision above.
- Sharing is a `Dialog` (`resources/js/components/share-dialog.tsx`, shadcn
  `Select` for the permission field) shown next to Delete on the edit page,
  owner-only. Unlike the create dialog, it uses raw `router.post` +
  component-local `useState` for errors (via the `onError` callback) instead
  of `useForm`, per an explicit ask to read `errors.email` inline rather than
  a generic alert — both patterns are fine, pick whichever fits: `useForm` if
  you want its built-in `processing`/`errors`/`reset`, raw `router.*` +
  `useState` if you want more control over the error shape.
- Dynamic breadcrumbs: assign `Page.layout` as a **function** of props (not a
  plain object) when the breadcrumb needs data only known at render time
  (e.g. the document's title) — Inertia calls it with the page's props and
  merges the returned `{ breadcrumbs }` into the resolved layout. See
  `documents/edit.tsx`. Static breadcrumbs (e.g. `documents/index.tsx`) still
  use the plain-object form like every other starter-kit page.
- Rich-text editing lives in `resources/js/components/editor/`:
  `DocumentEditor.tsx` wraps Tiptap's `useEditor`/`EditorContent`,
  `Toolbar.tsx` holds the formatting buttons. Wired into `documents/edit.tsx`
  in place of the old plain `Textarea` — same `content` string prop/shape as
  before (Tiptap's `getHTML()` output), so nothing downstream (the update
  request, the DB column) needed to change.
- **Tiptap v3 gotchas** (the installed version — v3, not the v2 shown in most
  tutorials/StackOverflow answers):
  - `useEditor`'s `shouldRerenderOnTransaction` option defaults to **false**
    now (marked legacy). Without it, a component that only reads
    `editor.isActive(...)` inline in JSX (like a toolbar) never re-renders on
    selection/content changes, so active-state buttons appear permanently
    "off" even though the mark *is* applied — this was an actual bug caught
    during manual testing, not a hypothetical. Fix: use the new
    `useEditorState({ editor, selector })` hook inside `Toolbar.tsx` to derive
    an active-state object — it subscribes to transactions and re-renders
    only that component, which is the officially recommended v3 pattern
    (flipping `shouldRerenderOnTransaction: true` on `useEditor` also works
    but is called out in Tiptap's own types as legacy/being removed).
  - `StarterKit` in v3 **already bundles the Underline extension**
    (`StarterKit.configure({ underline: false })` is required if you also
    register `@tiptap/extension-underline` yourself) — including both
    without disabling the built-in one throws a "Duplicate extension names
    found: ['underline']" console warning. We kept the explicit
    `@tiptap/extension-underline` per the original ask and disabled
    StarterKit's copy, rather than dropping the explicit package.
  - `immediatelyRender: false` is required on `useEditor` because this app
    renders through Inertia SSR (confirmed via the `[vite] SSR ...` dev-server
    log lines) — without it Tiptap logs an SSR hydration-mismatch warning.
  - No `@tailwindcss/typography` plugin is installed, so Tailwind's preflight
    strips default heading/list styling inside the editor. Minimal scoped
    CSS for `.doc-editor-content` (h2/h3/p/ul/ol/strong/em/u) was added to
    `resources/css/app.css` rather than pulling in the typography plugin for
    a handful of rules.
- File import (`resources/js/components/import-button.tsx`) uses a hidden
  native `<input type="file" accept=".txt,.md">` triggered by a visible
  `Button`'s `onClick` (`inputRef.current?.click()`), not a styled label —
  submits via `router.post(url, { file }, { forceFormData: true })`.
  `forceFormData: true` is required for file uploads through Inertia even
  though the data object isn't already a `FormData` instance; Inertia builds
  it for you. Errors surface via the same local-`useState` + `onError`
  pattern as `share-dialog.tsx`, not `useForm`.
- Autosave (`resources/js/hooks/use-autosave.ts`) debounces `title`/`content`
  1.5s then fires `router.put(url, {..., silent: true}, { preserveScroll:
  true, preserveState: true, only: [] })`. No `route()` global helper exists
  in this project (no Ziggy) — the hook takes the target `url` as a plain
  string param, built at the call site with the Wayfinder pattern
  (`documents.update.url(document.id)`), not a literal `route('documents.
  update', ...)` call like generic Inertia autosave examples show.
  - The request body includes `silent: true` specifically so
    `DocumentController@update` can skip its `Inertia::flash('toast', ...)`
    call for autosave PUTs — otherwise a "Document saved." toast would fire
    every 1.5s while typing. `UpdateDocumentRequest`'s rules only cover
    `title`/`content`, so the extra `silent` field passes through unvalidated
    and is read via `$request->boolean('silent')` in the controller, not
    added to the request's validation rules.
  - `only: []` only constrains the *immediate* PUT response (which is a
    redirect anyway, via `back()`) — Inertia's automatic redirect-follow GET
    still fetches full props afterward. `preserveState: true` is what
    actually prevents disruption: the page component isn't remounted, so
    Tiptap's editor DOM (cursor, focus, scroll) is untouched even though
    props like `document.title` *do* refresh behind the scenes (confirmed:
    the breadcrumb picks up the new title live, while the editor itself
    never visibly reset). `DocumentEditor`'s `content` option is read once at
    mount, not re-synced on prop changes, so a refreshed `document.content`
    prop doesn't fight with what the user is actively typing either.
  - Manually verified end-to-end (typed heading + bold + bullet-list
    formatting and a new title, waited past the debounce, confirmed via
    network inspection that exactly one silent PUT fired with no button
    click, then did a real hard reload): title and all formatting persisted
    byte-for-byte. See the conversation this was verified in for the full
    before/after HTML dumps.

### Permissions model
- `document_shares.permission` is a DB-level enum with exactly two values:
  `'view'` and `'edit'`. Defined directly in the migration
  (`$table->enum('permission', ['view', 'edit'])`), no separate PHP enum class
  yet — if one gets added later (e.g. `App\Enums\DocumentPermission`), update
  this note and the migration/casts together so they can't drift.

### Deployment (Railway)
- **Database is Postgres in production, SQLite only for local dev.** Neither
  Railway nor Render gives a plain container a persistent disk by default —
  local writes (including `database/database.sqlite`) are wiped on every
  redeploy unless you explicitly provision and mount a volume at that exact
  path. Rather than rely on remembering to attach/re-attach a volume
  correctly forever, production uses Railway's managed Postgres plugin
  instead. This required zero application code changes (Eloquent/Schema
  Builder throughout, no raw SQL) — verified for real, not just reasoned
  about, by running every migration and the seeder against an actual
  Postgres 16 container via Docker locally; row counts and the `permission`
  enum column matched exactly.
- `composer.json` declares `"ext-pdo_pgsql": "*"` in `require` so Railway's
  Nixpacks builder auto-installs the extension (it scans `composer.json` for
  `ext-*` requirements). This would break local `composer install` on a
  machine without that extension (confirmed: this sandbox's PHP doesn't have
  it), so `config.platform` in the same file fakes its presence
  (`"ext-pdo_pgsql": "8.3"`) for Composer's local dependency resolution —
  local dev still actually runs on `pdo_sqlite`, nothing about local
  behavior changes.
- `package.json` pins `"engines": { "node": "22.x" }` so Railway's Nixpacks
  build uses a consistent, known-compatible Node version rather than
  whatever its default happens to be (avoids the `EBADENGINE` warnings this
  repo's dependencies emit on other Node versions turning into an actual
  version mismatch on the deploy target).
- **SSR is explicitly off in production** via `INERTIA_SSR_ENABLED=false` →
  `config/inertia.php`'s `'ssr.enabled' => env('INERTIA_SSR_ENABLED', true)`
  (defaults `true` so local dev is unaffected). Belt-and-suspenders: even
  without this, SSR would silently no-op in production anyway, because we
  only run `npm run build` (not `npm run build:ssr`) so no
  `bootstrap/ssr/*` bundle exists, and Inertia's `HttpGateway` checks
  `bundleExists()` before ever attempting to reach the SSR server — but the
  explicit env flag makes the intent visible instead of relying on that
  fallback.
- `bootstrap/app.php` calls `$middleware->trustProxies(at: '*')`. Railway
  (like Render/Heroku) terminates TLS at its edge and forwards to the
  container over plain HTTP — without trusting that proxy, Laravel can't
  tell the original request was HTTPS, which breaks `SESSION_SECURE_COOKIE`
  and HTTPS URL generation. This project didn't have any trusted-proxy
  config before (the Laravel 11+ skeleton no longer ships a `TrustProxies`
  middleware class by default the way Laravel 10 did), so this was a real
  gap to fix, not pre-existing boilerplate.
- `railway.json` in the repo root pins the exact build/start commands
  explicitly rather than trusting Nixpacks' auto-detection:
  - Build: `composer install --no-dev --optimize-autoloader && npm ci && npm
    run build` — the Vite Wayfinder plugin regenerates the gitignored
    `resources/js/{actions,routes,wayfinder}` directories as part of
    `npm run build` itself (confirmed by deleting them locally and rebuilding
    — they came back, `.form()` variants included, no manual
    `wayfinder:generate --with-form` step needed here specifically because
    it goes through the Vite plugin path, not the raw CLI).
  - Start: `php artisan migrate --force --no-interaction && php artisan
    config:cache && php artisan route:cache && php artisan serve
    --host=0.0.0.0 --port=$PORT`. `route:cache` is safe here even though
    `Route::inertia(...)` is used throughout — confirmed its macro registers
    a real `\Inertia\Controller` class under the hood, not a raw closure, so
    it serializes fine (checked via `php artisan route:list` output and a
    successful `route:cache` run).
  - Migrations re-run on every restart, not just every deploy (Railway has no
    distinct release-phase step) — harmless since Laravel migrations are
    idempotent, but worth knowing so an unexpected extra ~1s of migrate
    output in boot logs isn't mistaken for something wrong.
- `.env.production.example` documents every variable to paste into Railway's
  dashboard (never committed with real values — `.env.production` itself
  stays gitignored). `DB_URL` is meant to be Railway's variable-reference
  syntax (`${{Postgres.DATABASE_URL}}`), not a literal connection string.
- Not automated: `php artisan db:seed` (creates alice/bob/carol demo
  accounts) is NOT part of the start command, because it's not idempotent —
  the seeder inserts fixed emails, so re-running it against an
  already-seeded DB fails on the unique constraint. Run it once manually via
  Railway's shell/CLI after the first successful deploy if demo accounts are
  wanted; don't add it to `railway.json`'s `startCommand`.
