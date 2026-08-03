# Architecture

This is a take-home-scoped project: the goal was a correct, well-tested slice of the feature set, not a system built to scale in complexity. Every decision below optimizes for shipping something small and clearly correct over something impressively extensible.

## Inertia instead of a separate API

The frontend never calls a JSON API — Inertia page components receive their data as props directly from Laravel controllers (`Inertia::render('documents/index', [...])`), and mutations go through Inertia's `router.post`/`put`/`delete`. This means one deploy target (a single Laravel app serving both the backend and the built React bundle), no CORS, no API versioning concerns, and no duplicate validation logic between an API layer and a web layer. The tradeoff — this couples the frontend tightly to Laravel's routing and can't trivially serve a separate mobile client later — isn't a real cost here; nothing in the brief asked for one.

## A single `DocumentPolicy` for all authorization

`view`, `update`, and `share` abilities all live in one policy class (`app/Policies/DocumentPolicy.php`), rather than being split across per-action policy classes or scattered `Gate::define` calls. Sharing permission logic (owner vs. `view` share vs. `edit` share vs. no relationship at all) is inherently one small decision tree, and every place that needs to answer "can this user do X to this document" asks the same policy. Splitting it up would have meant either duplicating the owner/share lookup logic or introducing a shared trait — more moving parts for no real benefit at this scale.

Note that `destroy()` deliberately does **not** go through the policy's `update` ability — deletion is gated on strict ownership (`$document->owner_id === auth()->id()`) directly in the controller, since an `edit`-permission sharee should be able to change content but not delete the document outright.

## Content stored as HTML in a `longtext` column

`documents.content` is a plain `longtext` column holding whatever HTML Tiptap's `editor.getHTML()` produces — no intermediate JSON document schema (à la ProseMirror's native JSON representation), no separate rendering step. Tiptap already round-trips HTML cleanly, and storing the exact rendered format means there's no serialization/deserialization layer to keep in sync with the editor's schema as extensions get added. The cost is that HTML is a slightly less structured storage format than a JSON AST (harder to do structural diffs or partial updates against), which doesn't matter for a single-editor-at-a-time, whole-document-save workflow like this one.

## No client-side state library

There's no Redux, no React Context for server data, no data-fetching library. Inertia's page props *are* the state — every page component receives exactly what it needs to render, and re-fetches happen through normal Inertia navigation or explicit partial reloads (see the autosave note below). Local-only UI state (dialog open/closed, form field values before submission) uses plain `useState`. Given the app's actual state needs — a handful of pages, no cross-page shared client state, no offline/optimistic-update requirements — a state library would add ceremony without solving a problem that exists here.

## Other decisions worth calling out

- **No repository or service layer.** Controllers talk to Eloquent models directly. `DocumentController`, `ShareController`, and `ImportController` are three separate single-action-ish controllers rather than one fat controller, because sharing and importing are distinct concerns with their own validation (`ShareDocumentRequest`, `ImportDocumentRequest`) even though they both end up touching a `Document`.
- **Autosave is a debounced PUT, not a separate endpoint.** `resources/js/hooks/use-autosave.ts` reuses the same `documents.update` route as the manual Save button, distinguished only by a `silent: true` flag (so the success toast doesn't fire on every autosave) and Inertia's `preserveState`/`only: []` options (so the request doesn't disrupt the editor's local state or cursor position).
- **Tiptap v3**, not v2 — most tutorials and Stack Overflow answers online describe v2 behavior (e.g. toolbars auto-re-rendering on selection change), which silently doesn't apply anymore; see `CLAUDE.md` for the specific gotchas this surfaced.
- **SQLite locally, Postgres in production.** Neither of the free-tier deploy targets considered (Railway, Render) gives a container a persistent disk by default, so a plain SQLite file would be wiped on every redeploy. Switching the production connection to Postgres required zero application code changes, since nothing in the app uses raw SQL — this was verified by actually running the migrations and seeder against a real Postgres container, not just assumed from using the query builder.
