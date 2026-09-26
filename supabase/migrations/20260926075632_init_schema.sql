create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  first_name text,
  role text check (role in ('parent', 'student')) default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile."
  on profiles for select to authenticated using ( auth.uid() = id );

create policy "Users can update their own profile."
  on profiles for update to authenticated using ( auth.uid() = id );

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, role)
  values (new.id, new.raw_user_meta_data->>'first_name', 'parent');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();