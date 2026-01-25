-- 03_business_logic.sql
-- Triggers, RPC functions, and Views

-- 1. AUTH TRIGGER (Automatically create profile on signup)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
exception
  when others then
    raise warning 'Error creating profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. RPC FUNCTIONS (For efficient frontend retrieval)
create or replace function get_unique_subjects()
returns table (subjek text)
language sql
security definer
as $$
  select distinct subjek from public.referensi_rph order by subjek;
$$;

create or replace function get_unique_years()
returns table (tahun integer)
language sql
security definer
as $$
  select distinct tahun from public.referensi_rph where tahun is not null order by tahun;
$$;


-- 3. VIEWS
create or replace view public.view_subjek as
select distinct subjek from public.referensi_rph order by subjek;

create or replace view public.view_tahun as
select distinct tahun from public.referensi_rph where tahun is not null order by tahun;


-- 4. PERMISSIONS & GRANTS
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant execute on function get_unique_subjects() to anon, authenticated;
grant execute on function get_unique_years() to anon, authenticated;
grant select on public.view_subjek to anon, authenticated;
grant select on public.view_tahun to anon, authenticated;

-- Reload PostgREST cache
notify pgrst, 'reload schema';
