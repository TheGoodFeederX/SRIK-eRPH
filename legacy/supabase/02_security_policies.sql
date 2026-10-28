-- 02_security_policies.sql
-- Security configuration and Row Level Security (RLS) policies

-- Enable RLS on all tables
alter table public.referensi_rph enable row level security;
alter table public.rph_records enable row level security;
alter table public.profiles enable row level security;

-- 1. Policies for referensi_rph (DSKP)
-- Public read access for everyone
drop policy if exists "Anyone can read reference data" on public.referensi_rph;
create policy "Anyone can read reference data"
on public.referensi_rph for select
using (true);

-- Authenticated users can manage reference data (for the DSKP Manager)
drop policy if exists "Authenticated users can add reference data" on public.referensi_rph;
create policy "Authenticated users can add reference data"
on public.referensi_rph for insert
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update reference data" on public.referensi_rph;
create policy "Authenticated users can update reference data"
on public.referensi_rph for update
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete reference data" on public.referensi_rph;
create policy "Authenticated users can delete reference data"
on public.referensi_rph for delete
using (auth.role() = 'authenticated');


-- 2. Policies for rph_records
-- Users can manage ONLY their own records
drop policy if exists "Allow all access to RPH records" on public.rph_records;
drop policy if exists "Users can only access their own records" on public.rph_records;
create policy "Users can manage own records"
on public.rph_records for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- 3. Policies for profiles
-- Users can manage their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);
