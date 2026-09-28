create table public.school_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  event_date date not null,
  start_time time without time zone,
  end_time time without time zone,
  is_all_day boolean default true,
  source text, -- e.g., 'School' or 'Preschool'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.school_events enable row level security;

-- Everyone (parents and student) can view the events
create policy "Authenticated users can view school events"
  on school_events for select
  to authenticated
  using (true);

-- Only parents can manage events (enforced via the role column in our profiles table)
create policy "Only parents can insert events"
  on school_events for insert
  to authenticated
  with check ( exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'parent'
  ) );

create policy "Only parents can update events"
  on school_events for update
  to authenticated
  using ( exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'parent'
  ) );

create policy "Only parents can delete events"
  on school_events for delete
  to authenticated
  using ( exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'parent'
  ) );