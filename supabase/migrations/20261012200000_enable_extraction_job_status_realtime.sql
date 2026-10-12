grant select on table public.extraction_jobs to authenticated;

create policy "Users can view their own extraction jobs"
  on public.extraction_jobs
  for select
  to authenticated
  using (user_id = (select auth.uid()));

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'extraction_jobs'
  ) then
    alter publication supabase_realtime add table public.extraction_jobs;
  end if;
end;
$$;
