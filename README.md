# Ekis Web

Next.js App Router application with Supabase SSR authentication support.

## Local setup

1. Copy `.env.example` to `.env.local` and provide the Supabase project URL and publishable key.
2. Set `SUPABASE_SERVICE_ROLE_KEY` to the service-role key from your Supabase project's API settings. This is a server-only secret used by the calendar download route; do not commit it or expose it to browser code.
3. Set `GOOGLE_GENERATIVE_AI_API_KEY` to your Google Generative AI API key.
4. Install dependencies with `npm install`.
5. Start the application with `npm run dev`.

For deployed environments, configure `SUPABASE_SERVICE_ROLE_KEY` as a server-side environment variable or secret in your hosting platform. Do not use a `NEXT_PUBLIC_` prefix.

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
