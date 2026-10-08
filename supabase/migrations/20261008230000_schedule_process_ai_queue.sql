-- Replace <YOUR_PROJECT_REF> with your Supabase project ref before pushing
-- these database changes.
-- Store the service-role key in Supabase Vault as
-- `process_queue_service_role_key`; do not put the actual key in this file.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists vault;
create extension if not exists supabase_vault with schema vault;

select cron.schedule(
  'process-ai-queue',
  '* * * * *',
  $$
  with worker_key as (
    select decrypted_secret
    from vault.decrypted_secrets
    where name = 'process_queue_service_role_key'
    limit 1
  )
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/process-queue',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || worker_key.decrypted_secret,
      'apikey', worker_key.decrypted_secret,
      'Content-Type',
      'application/json'
    ),
    body := '{}'::jsonb
  )
  from worker_key;
  $$
);
