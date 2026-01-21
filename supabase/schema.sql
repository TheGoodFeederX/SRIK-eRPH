-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table for reference data from Excel
create table if not exists public.referensi_rph (
    id uuid primary key default uuid_generate_v4(),
    subjek text not null,
    tahun integer,
    sk text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table for teaching records
create table if not exists public.rph_records (
    id uuid primary key default uuid_generate_v4(),
    tarikh date not null,
    hari text not null,
    kelas text not null,
    masa text not null,
    subjek text not null,
    tajuk_standard_kandungan text not null,
    aktiviti text not null,
    refleksi text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) -- Optional: for authentication
);

-- Indices for performance
create index if not exists idx_referensi_subjek on public.referensi_rph(subjek);
create index if not exists idx_referensi_tahun on public.referensi_rph(tahun);

-- RLS (Row Level Security) - Simplified for now, allow all access
-- WARNING: In production, you should restrict this to authenticated users
alter table public.referensi_rph enable row level security;
alter table public.rph_records enable row level security;

create policy "Allow all access to reference data" on public.referensi_rph for all using (true) with check (true);
create policy "Allow all access to RPH records" on public.rph_records for all using (true) with check (true);
