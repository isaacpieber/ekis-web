-- Store the `queue_worker` Secret API key in Supabase Vault as
-- `process_queue_api_key`; do not put the actual key in this file.
-- Store each environment's project URL in Supabase Vault as
-- `process_queue_project_url` so this migration can be shared safely.

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
    where name = 'process_queue_api_key'
    limit 1
  ),
  project_url as (
    select decrypted_secret
    from vault.decrypted_secrets
    where name = 'process_queue_project_url'
    limit 1
  )
  select net.http_post(
    url := project_url.decrypted_secret || '/functions/v1/process-queue',
    headers := jsonb_build_object(
      'apikey', worker_key.decrypted_secret,
      'Content-Type',
      'application/json'
    ),
    body := '{}'::jsonb
  )
  from worker_key
  cross join project_url;
  $$
);
