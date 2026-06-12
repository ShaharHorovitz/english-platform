# Deployment notes

Running TODO list of things to get right when we deploy to Vercel (Phase 5 / post-build).

## Database connection — use the Transaction pooler on Vercel ⚠️

Local development and migrations use the Supabase **Session pooler** (port `5432`),
because the direct connection host (`db.<ref>.supabase.co`) is **IPv6-only** and not
reachable from many local networks.

**Vercel serverless functions are different.** Each invocation is short-lived and
there can be many concurrent ones, so they must use the **Transaction pooler**
(port `6543`), not the session pooler or the direct connection:

```
postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres
```

- Our DB client (`src/db/index.ts`) already sets `prepare: false`, which is **required**
  for the transaction pooler (it doesn't support prepared statements). So no code change
  is needed — just set the right `DATABASE_URL` value in Vercel.
- Set `DATABASE_URL` (transaction pooler URI) in **Vercel → Project → Settings →
  Environment Variables** for Production (and Preview).
- Keep using the **Session pooler** locally and for `drizzle-kit migrate` (DDL is more
  reliable on a session connection). Migrations are run from a dev machine / CI, not
  from a serverless function.

## Environment variables to set in Vercel

Mirror `.env.local` (see README for where each comes from):

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | same as local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret — server only |
| `DATABASE_URL` | **Transaction pooler (port 6543)** — see above |
| `TEACHER_EMAIL` | only needed if seeding from CI |
| `SEED_TEST_PASSWORD` | only needed if seeding from CI |

## Other pre-deploy checks

- [ ] Supabase Auth → URL configuration: add the production domain to redirect/allow lists.
- [ ] Confirm RLS is enabled in production (it is, via `supabase/migrations/0001_rls_policies.sql`).
- [ ] Run `npm run db:migrate` against production before first deploy.
