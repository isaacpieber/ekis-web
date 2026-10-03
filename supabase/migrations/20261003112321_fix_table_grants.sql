grant select on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

grant select, insert, update, delete on table public.school_events to authenticated;
grant all on table public.school_events to service_role;