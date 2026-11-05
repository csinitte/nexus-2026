# NEXUS 2026

A Next.js starter for the CSI Student Summit on Innovation & Technology. The product requirements are in [PRD.md](PRD.md). The event website and registration system have not been implemented yet.

## Getting started

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The starter page is at `src/app/page.tsx`.

## Checks

```bash
npm run lint
npm run build
```

## Backend development with Bun

Install dependencies with `bun install`, copy `.env.example` to `.env.local`, and run `bun run dev`. Leave external-service settings unset for local development: PGlite persists in `.data/pglite`, abstracts are kept privately in `.data/abstracts`, and confirmation email delivery is skipped. Set `DATABASE_URL` for PostgreSQL; run `bun run db:migrate` to apply migrations. Use `bun run db:generate` after schema changes and `bun run db:studio` to inspect PostgreSQL. Production requires a database URL, admin credentials or active admin records, and a `NEXUS_SESSION_SECRET` of at least 32 characters.

Registration submissions accept JSON or multipart form data. Use `students` for the array of student representatives and `expo` for the optional project, with `teamMembers` containing student indexes, names, or email addresses. For multipart, send a JSON `payload` field and an `abstract` PDF file. For JSON, `expo.abstract` accepts `{ "fileName": "abstract.pdf", "mimeType": "application/pdf", "base64": "..." }`. The registration summary endpoint requires the signed confirmation token as a bearer token; set `NEXUS_SESSION_SECRET` to enable signed tokens. The confirmation screen also provides a downloadable summary. Admin login returns a bearer token and an HTTP-only cookie; CSV exports are available at `/api/admin/registrations/export` and `/api/admin/expo?format=csv`.

Run `bun test`, `bun run lint`, and `bun run build` to verify changes. Never serve `.data` as static content or commit credentials.
