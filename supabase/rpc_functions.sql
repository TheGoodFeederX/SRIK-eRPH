-- 1. Function to get unique subjects efficiently
create or replace function get_unique_subjects()
returns table (subjek text)
language sql
security definer
as $$
  select distinct subjek from public.referensi_rph order by subjek;
$$;

-- 2. Function to get unique years efficiently
create or replace function get_unique_years()
returns table (tahun integer)
language sql
security definer
as $$
  select distinct tahun from public.referensi_rph where tahun is not null order by tahun;
$$;

-- 3. Grant execution permissions
grant execute on function get_unique_subjects() to anon, authenticated;
grant execute on function get_unique_years() to anon, authenticated;

-- 4. Reload PostgREST schema cache (force refresh)
notify pgrst, 'reload schema';
