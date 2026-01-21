-- Refine RLS policies for rph_records to be user-specific
drop policy if exists "Allow all access to RPH records" on public.rph_records;

create policy "Users can only access their own records"
on public.rph_records
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Keep reference data public but read-only for users
drop policy if exists "Allow all access to reference data" on public.referensi_rph;

create policy "Anyone can read reference data"
on public.referensi_rph
for select
using (true);

-- Ensure RLS is enabled
alter table public.referensi_rph enable row level security;
alter table public.rph_records enable row level security;
