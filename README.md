# Ekis Web

## Local development

1. Install Node.js 20.9 or later.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local`, then add the Supabase project URL and publishable key.
4. Start the development server:

   ```bash
   npm run dev
   ```

## Supabase migrations

Store migrations in `supabase/migrations/` with timestamped filenames, for example:

```text
supabase/migrations/20260924215400_init_schema.sql
```

Apply migrations to the local Supabase database:

```bash
npx supabase db reset
```

After linking a remote project, deploy pending migrations with:

```bash
npx supabase db push
```
