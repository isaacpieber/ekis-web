# Ekis Web

Next.js App Router application with Supabase SSR authentication support.

## Local setup

1. Copy `.env.example` to `.env.local` and provide the Supabase project URL and publishable key.
2. Install dependencies with `npm install`.
3. Start the application with `npm run dev`.

## Authentication

`middleware.ts` refreshes Supabase sessions for application requests. Routes below
`/protected` require an authenticated user and redirect unauthenticated requests to
`/login`. Add additional protected route prefixes to `PROTECTED_PATHS` in
`utils/supabase/middleware.ts`.

## Database migrations

Place the existing `init_schema.sql` migration in `supabase/migrations/` using a
timestamped filename, for example:

```text
supabase/migrations/20260924224000_init_schema.sql
```

After starting the local Supabase stack, apply pending migrations with:

```bash
npx supabase start
npx supabase db reset
```

Use `npx supabase db push` only to apply those migrations to a linked remote
Supabase project.
