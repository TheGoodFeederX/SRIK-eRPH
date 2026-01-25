-- 01_initial_schema.sql
-- Base table definitions and indices

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table for DSKP reference data
create table if not exists public.referensi_rph (
    id uuid primary key default uuid_generate_v4(),
    subjek text not null,
    tahun integer,
    sk text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table for teaching records (RPH)
create table if not exists public.rph_records (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    tarikh date not null,
    hari text not null,
    kelas text not null,
    masa text not null,
    subjek text not null,
    tajuk_standard_kandungan text not null,
    objektif text,
    aktiviti text not null,
    refleksi text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table for user profiles
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    email text,
    full_name text,
    name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indices for performance
create index if not exists idx_referensi_subjek on public.referensi_rph(subjek);
create index if not exists idx_referensi_tahun on public.referensi_rph(tahun);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_rph_user_date on public.rph_records(user_id, tarikh desc);
