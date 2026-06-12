# English Learning Platform

A private web platform for English students (ages 10–16, grades 5–12 in Israel) to
practice vocabulary and reading comprehension ("unseens"). Students get accounts via
invite code — **no public signup**. A teacher role manages all content.

> **Status: POC — frame only.** The full structure, auth, navigation, progression
> logic, and admin tools are being built with placeholder content (lorem ipsum
> passages, `word1`/`מילה1` vocab). Real content is added later through the admin panel.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** + shadcn/ui
- **Supabase** — Postgres + Auth + Row Level Security
- **Drizzle ORM** — owns table DDL; RLS policies live in raw SQL
- Deployed to **Vercel**

> Next.js 16 note: the `middleware` convention is renamed to `proxy` (see
> `src/proxy.ts`), and request APIs like `cookies()` are async. Don't reintroduce
> a `middleware.ts`.

## Information architecture

```
Grades (5th → 12th)
└── Units (ordered)
    └── Tasks (ordered, sequential completion required)
        - Vocabulary Study (flashcards)
        - Vocabulary Practice (matching / multiple choice / fill-in)
        - Reading Passage (text + comprehension questions)
        - Vocabulary in Context (use the words)
```

Progression locks tasks/units until the previous one is completed. Lock state is
**derived** at read time from completion — never stored.

## Project structure

```
src/
├── app/                  # App Router routes (UI — built in later phases)
├── db/
│   ├── schema.ts         # Drizzle tables + enums
│   ├── relations.ts      # Drizzle relations
│   ├── index.ts          # db client (postgres-js)
│   ├── load-env.ts       # loads .env.local for CLI scripts
│   └── seed.ts           # placeholder seed
├── lib/
│   ├── content-schemas.ts # Zod schemas for task `content` JSONB
│   └── supabase/         # browser + server clients, session refresh
└── proxy.ts              # Next 16 "middleware" — refreshes auth session
supabase/migrations/      # RLS policies + auth FK (raw SQL)
drizzle/migrations/       # generated SQL migrations
```

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in the values per the next section.

3. **Run database migrations** (creates the tables)

   ```bash
   npm run db:generate   # generate SQL from src/db/schema.ts
   npm run db:migrate    # apply to your Supabase database
   ```

4. **Apply RLS policies** — open the Supabase **SQL Editor** and run the contents of
   `supabase/migrations/0001_rls_policies.sql`. This adds Row Level Security, the
   `profiles → auth.users` foreign key (ON DELETE CASCADE), and helper functions.
   It's idempotent.

5. **Seed placeholder data + accounts**

   ```bash
   npm run db:seed
   ```

6. **Run the app**

   ```bash
   npm run dev
   ```

## Environment variables

Copy each from the Supabase dashboard for the **english-platform** project:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings → API → Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project Settings → API → Project API keys → `anon` / publishable** |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API → Project API keys → `service_role` / secret** (server-only, never expose) |
| `DATABASE_URL` | **Connect** button (top bar) → **ORMs** / **Drizzle**, or **Session pooler** URI. Insert your DB password. |
| `TEACHER_EMAIL` | Your email — becomes the seeded teacher account. |
| `SEED_TEST_PASSWORD` | Password for the seeded teacher + test students (default `password123`). |

## Database scripts

| Command | What it does |
| --- | --- |
| `npm run db:generate` | Generate a SQL migration from schema changes |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:push` | Push schema directly (dev only — skips migration files) |
| `npm run db:studio` | Open Drizzle Studio to browse data |
| `npm run db:seed` | Reseed placeholder content + accounts |

After **any** change to `src/db/schema.ts`, run `db:generate` then `db:migrate`.

### Indexing note

`user_progress` has a unique constraint on `(user_id, task_id)` (which also indexes
lookups by that pair) plus an explicit index on `(user_id, status)` for the
"find this user's incomplete tasks" hot path.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Note: Vercel serverless must use the
Supabase **Transaction pooler (port 6543)** for `DATABASE_URL`, not the session pooler
used locally.

## Seeded accounts

- **Teacher** — `TEACHER_EMAIL` (role: teacher, full admin access)
- **Students** — `student1@example.com`, `student2@example.com` (assigned to 5th Grade)

All use `SEED_TEST_PASSWORD`.

## Adding content via the admin panel

(Admin UI is built in Phase 5.) The teacher account accesses `/admin` to:

- CRUD grades, units, and tasks
- Edit each task's `content` via a JSON editor validated against the Zod schemas in
  `src/lib/content-schemas.ts`
- Bulk-import vocab per unit from JSON
- Generate invite codes (each code assigns a grade at creation)
- View per-student progress

Every task page reads its content from the `tasks.content` JSONB column, so new content
works without code changes as long as it validates against the matching schema.

## Auth flow

1. Landing page (`/`) has **Sign In only** — no public signup.
2. New students get an invite code from the teacher.
3. `/redeem` → enter code → set name + password → account created with the assigned grade.
4. Returning students log in at `/login` with email + password.
5. The teacher role accesses `/admin`.

## Build phases

1. Scaffolding + Supabase + Drizzle schema + migrations + seed ← **current**
2. Auth (login + invite redemption) + protected routes + role gating
3. Student dashboard + grade + unit pages with progression logic
4. All four task type pages (reading content from JSONB)
5. Teacher admin (CRUD + JSON editor + invite codes + progress view)
