# Document Editor

A lightweight collaborative document editor (Google-Docs-lite) built with Laravel, Inertia, and React. Create documents, edit them with a rich-text toolbar, share them with other users at `view` or `edit` permission, import `.txt`/`.md` files, and have edits save automatically.

## Stack

Laravel 13 + Inertia 2 + React 19 (TypeScript, Tailwind, shadcn/ui, Fortify auth) via the official Laravel React starter kit, Tiptap v3 for rich text, `league/commonmark` for Markdown import.

## Requirements

- PHP 8.3+
- Composer
- Node 22.x
- SQLite (bundled with PHP; no separate DB server needed for local dev)

## Setup

```bash
composer install
npm install

cp .env.example .env
php artisan key:generate

touch database/database.sqlite
php artisan migrate --seed
```

Then run the app. The starter kit ships a `composer dev` script that runs the PHP server, queue listener, log tailer, and Vite dev server together:

```bash
composer dev
```

Or run the pieces separately if you'd rather:

```bash
php artisan serve
npm run dev
```

Visit **http://localhost:8000**.

## Seeded accounts

`php artisan migrate --seed` creates three users, all with the password below:

| Name  | Email             | Password   |
|-------|-------------------|------------|
| Alice | alice@test.com    | `password` |
| Bob   | bob@test.com      | `password` |
| Carol | carol@test.com    | `password` |

Alice owns three sample documents ("Project Roadmap", "Meeting Notes - Weekly Sync", "Reading List") and has shared "Project Roadmap" with Bob at `edit` permission — log in as Bob to see it under "Shared with me" immediately. Carol has no documents or shares, useful for exercising the no-access case.

## Importing files

The import button on the documents page accepts **`.txt` and `.md` files only**, up to 2MB. `.txt` content is HTML-escaped and wrapped in a single paragraph; `.md` content is converted to HTML via CommonMark. `.docx` and other formats are rejected with a validation error naming the allowed types — there's no `.docx` parser in this project.

## Running tests

```bash
composer test
# or directly:
vendor/bin/phpunit
```

50 tests / 173 assertions, including feature tests for document sharing permissions (`tests/Feature/DocumentPolicyTest.php`, `tests/Feature/DocumentSharingTest.php`) and file import (`tests/Feature/DocumentImportTest.php`).

## Live deployment

Not completed — see `SUBMISSION.md`'s "Deployment status" section for why (Railway trial expired mid-project; the Render replacement — Dockerfile + `render.yaml` — is built and verified locally but the dashboard deploy itself wasn't finished in time) and what's ready to go.

## Full submission materials

See `SUBMISSION.md` for test credentials, feature status (working/incomplete/next steps), and the Google Drive folder link. See `ARCHITECTURE.md` for the reasoning behind key decisions and `CLAUDE.md` for detailed implementation conventions.
