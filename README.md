# Ekis Web

Next.js App Router application with Supabase SSR authentication support.

## Local setup

1. Copy `.env.example` to `.env.local` and provide the Supabase project URL and publishable key.
2. Set `SUPABASE_SERVICE_ROLE_KEY` to the service-role key from your Supabase project's API settings. This is a server-only secret used by the calendar download route; do not commit it or expose it to browser code.
3. Install dependencies with `npm install`.
4. Start the application with `npm run dev`.

Set `AI_API_KEY` as a Supabase Edge Function secret; do not add it to the
Next.js environment or expose it to the browser:

```bash
npx supabase secrets set AI_API_KEY=your-google-generative-ai-api-key
```

Deploy the extraction functions with `npx supabase functions deploy extract-events`
and `npx supabase functions deploy process-queue`. Before applying the queue
schedule migration, replace `<YOUR_PROJECT_REF>` in its function URL and store
the service-role key in Supabase Vault as `process_queue_service_role_key`.
Never commit the actual key. The migration schedules `process-ai-queue` every
minute. Completed and failed queue records are purged after 30 days, and
newsletter text is cleared as soon as a job reaches a terminal state.

Add the service-role key to Vault once in the Supabase SQL editor before
applying the schedule migration:

```sql
select vault.create_secret(
  '<YOUR_SERVICE_ROLE_KEY>',
  'process_queue_service_role_key'
);
```

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
