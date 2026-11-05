# NEXUS 2026

The website and registration system for NEXUS 2026 — CSI Student Summit on Innovation & Technology, 25 November 2026 at NMAMIT, Nitte. Product requirements are in [PRD.md](PRD.md).

## Getting started

Requires Node.js 20.9+ (or Bun). See the backend section below for environment variables.

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Frontend

| Route | What it is |
| --- | --- |
| `/` | Intro animation (once per session), landing hero, About NEXUS, hosts |
| `/schedule`, `/panel`, `/showcase`, `/expo`, `/contact` | Information pages in the fixed PRD order |
| `/register` | Seven-step registration form with draft saving, validation and confirmation |
| `/summary#CODE:TOKEN` | Signed registration summary linked from the confirmation email |
| `/admin` | Organiser dashboard (overview, search, verify, edit, Expo review, CSV export) |

- **Content** — all approved copy (schedule, panel highlights, Expo categories, contacts, etc.) lives in `src/content/nexus.ts`. Edit text there, not in page files. Add confirmed panelists to `PANEL.panelists`. Replace `public/Chapter_Showcase_Template.pdf` to update the showcase template.
- **Theme** — the charcoal theme from the NEXUS landing design: tokens at the top of `src/app/globals.css`, brand assets in `public/brand/`, fonts (Unbounded, Inter, JetBrains Mono) in `src/app/layout.tsx`.
- **Intro** — `src/components/intro/` ports the Nexus intro design. It plays once per browser session, can be skipped (button or Esc), never plays for reduced-motion users, and can be replayed with `/?intro=1` (footer link). `/?intro=0` skips it.
- **Registration form** — `src/components/register/`. `model.ts` holds the state, steps and client-side rules that mirror `src/lib/nexus/validation.ts`; a unit test checks the form payload against the server validator.
- **WhatsApp group** — set `WHATSAPP_COMMUNITY_LINK`; it appears on the contact page and the confirmation screen.

## Checks

```bash
bun test          # unit tests (backend + registration form)
bun run lint
bun run build
node e2e/registration.flow.mjs http://localhost:3000   # browser test of the full registration flow (needs Playwright)
```

## Backend development with Bun

Install dependencies with `bun install`, copy `.env.example` to `.env.local`, and run `bun run dev`. Leave external-service settings unset for local development: PGlite persists in `.data/pglite`, abstracts are kept privately in `.data/abstracts`, and confirmation email delivery is skipped. Set `DATABASE_URL` for PostgreSQL; run `bun run db:migrate` to apply migrations. Use `bun run db:generate` after schema changes and `bun run db:studio` to inspect PostgreSQL. Production requires a database URL, admin credentials or active admin records, and a `NEXUS_SESSION_SECRET` of at least 32 characters.

Registration submissions accept JSON or multipart form data. Use `students` for the array of student representatives and `expo` for the optional project, with `teamMembers` containing student indexes, names, or email addresses. For multipart, send a JSON `payload` field and an `abstract` PDF file. For JSON, `expo.abstract` accepts `{ "fileName": "abstract.pdf", "mimeType": "application/pdf", "base64": "..." }`. The registration summary endpoint requires the signed confirmation token as a bearer token; set `NEXUS_SESSION_SECRET` to enable signed tokens. The confirmation screen also provides a downloadable summary. Admin login returns a bearer token and an HTTP-only cookie; CSV exports are available at `/api/admin/registrations/export` and `/api/admin/expo?format=csv`.

Run `bun test`, `bun run lint`, and `bun run build` to verify changes. Never serve `.data` as static content or commit credentials.
