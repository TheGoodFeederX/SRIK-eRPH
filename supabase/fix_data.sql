-- 1. Remove duplicates from referensi_rph
delete from public.referensi_rph a using public.referensi_rph b
where a.id < b.id
and a.subjek = b.subjek
and (a.tahun = b.tahun or (a.tahun is null and b.tahun is null))
and a.sk = b.sk;

-- 2. Create optimized views for unique values
create or replace view public.view_subjek as
select distinct subjek from public.referensi_rph order by subjek;

create or replace view public.view_tahun as
select distinct tahun from public.referensi_rph where tahun is not null order by tahun;

-- 3. Grant access to views (Supabase RLS doesn't apply to views by default in the same way, but we ensure read access)
grant select on public.view_subjek to anon, authenticated;
grant select on public.view_tahun to anon, authenticated;
