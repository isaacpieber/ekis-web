create table public.extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_text text not null check (char_length(raw_text) between 0 and 50000),
  source text not null check (source in ('School', 'Preschool', 'Other')),
  week_label text not null check (week_label ~ '^[0-9]{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$'),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  retry_count integer not null default 0 check (retry_count >= 0),
  next_attempt_at timestamp with time zone default now(),
  attempt_count smallint not null default 0 check (attempt_count between 0 and 6),
  last_error text,
  claimed_at timestamp with time zone,
  claim_token uuid,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  check (
    (status in ('pending', 'processing') and char_length(raw_text) between 1 and 50000)
    or (status in ('completed', 'failed') and raw_text = '')
  )
);

create index extraction_jobs_pending_created_at_idx
  on public.extraction_jobs (created_at)
  where status = 'pending';

create index extraction_jobs_processing_claimed_at_idx
  on public.extraction_jobs (claimed_at)
  where status = 'processing';

create index extraction_jobs_pending_next_attempt_idx
  on public.extraction_jobs (next_attempt_at, created_at)
  where status = 'pending';

create index extraction_jobs_terminal_updated_at_idx
  on public.extraction_jobs (updated_at)
  where status in ('completed', 'failed');

alter table public.extraction_jobs enable row level security;

revoke all on table public.extraction_jobs from public, anon, authenticated;
grant insert (user_id, raw_text, source, week_label)
  on table public.extraction_jobs to authenticated;
grant all on table public.extraction_jobs to service_role;

create policy "Parents can queue their own extractions"
  on public.extraction_jobs
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and char_length(raw_text) between 1 and 50000
    and status = 'pending'
    and retry_count = 0
    and attempt_count = 0
    and claimed_at is null
    and claim_token is null
    and last_error is null
    and exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'parent'
    )
  );

create function public.claim_extraction_jobs()
returns setof public.extraction_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Only the service role can claim extraction jobs.';
  end if;

  delete from public.extraction_jobs
  where status in ('completed', 'failed')
    and updated_at < now() - interval '30 days';

  update public.extraction_jobs
  set status = 'failed',
      raw_text = '',
      claim_token = null,
      claimed_at = null,
      next_attempt_at = null,
      last_error = coalesce(last_error, 'Worker attempt limit reached after repeated timeouts.'),
      updated_at = now()
  where status = 'processing'
    and claimed_at < now() - interval '10 minutes'
    and attempt_count >= 6;

  return query
  with candidates as (
    select jobs.id
    from public.extraction_jobs as jobs
    where (
      jobs.status = 'pending'
      and jobs.attempt_count < 6
      and jobs.next_attempt_at <= now()
    )
    or (
      jobs.status = 'processing'
      and jobs.claimed_at < now() - interval '10 minutes'
      and jobs.attempt_count < 6
    )
    order by jobs.created_at
    for update skip locked
    limit 5
  )
  update public.extraction_jobs as jobs
  set status = 'processing',
      attempt_count = jobs.attempt_count + 1,
      claim_token = gen_random_uuid(),
      claimed_at = now(),
      updated_at = now()
  from candidates
  where jobs.id = candidates.id
  returning jobs.*;
end;
$$;

create function public.finish_extraction_job(
  p_job_id uuid,
  p_claim_token uuid,
  p_events jsonb,
  p_error text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.extraction_jobs%rowtype;
  job_status text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Only the service role can finish extraction jobs.';
  end if;

  select *
  into job
  from public.extraction_jobs
  where id = p_job_id
    and status = 'processing'
    and claim_token = p_claim_token
  for update;

  if not found then
    return 'not_claimed';
  end if;

  if p_error is null then
    if jsonb_typeof(coalesce(p_events, '[]'::jsonb)) is distinct from 'array' then
      raise exception 'Extracted events must be a JSON array.';
    end if;

    insert into public.school_events (
      title,
      description,
      event_date,
      start_time,
      end_time,
      is_all_day,
      source
    )
    select
      event.title,
      event.description,
      event.event_date,
      event.start_time,
      event.end_time,
      event.is_all_day,
      event.source
    from jsonb_to_recordset(coalesce(p_events, '[]'::jsonb)) as event(
      title text,
      description text,
      event_date date,
      start_time time without time zone,
      end_time time without time zone,
      is_all_day boolean,
      source text
    );

    update public.extraction_jobs
    set status = 'completed',
        raw_text = '',
        claim_token = null,
        claimed_at = null,
        next_attempt_at = null,
        last_error = null,
        updated_at = now()
    where id = p_job_id;

    return 'completed';
  end if;

  update public.extraction_jobs
  set retry_count = retry_count + 1,
      status = case
        when retry_count + 1 > 5 or attempt_count >= 6 then 'failed'
        else 'pending'
      end,
      raw_text = case
        when retry_count + 1 > 5 or attempt_count >= 6 then ''
        else raw_text
      end,
      next_attempt_at = case
        when retry_count + 1 > 5 or attempt_count >= 6 then null
        else now() + least(
          interval '1 minute' * power(2::double precision, retry_count),
          interval '30 minutes'
        )
      end,
      claim_token = null,
      claimed_at = null,
      last_error = left(p_error, 2000),
      updated_at = now()
  where id = p_job_id
  returning status into job_status;

  return job_status;
end;
$$;

revoke all on function public.claim_extraction_jobs() from public, anon, authenticated;
revoke all on function public.finish_extraction_job(uuid, uuid, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.claim_extraction_jobs() to service_role;
grant execute on function public.finish_extraction_job(uuid, uuid, jsonb, text)
  to service_role;
