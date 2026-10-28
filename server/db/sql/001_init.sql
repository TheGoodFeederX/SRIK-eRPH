-- SRIK-eRPH schema (Neon PostgreSQL). Idempotent: safe to run repeatedly.

create extension if not exists pgcrypto;

-- Application membership. Identity lives in neon_auth.*; this table decides access.
create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  name text not null,
  role text not null default 'teacher' check (role in ('teacher', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rph_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tarikh date not null,
  hari text not null,
  tahun integer not null check (tahun between 1 and 6),
  kelas text not null,
  masa text not null,
  subjek text not null,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referensi_rph (
  id uuid primary key default gen_random_uuid(),
  subjek text not null,
  tahun integer not null check (tahun between 1 and 6),
  bidang text,
  sk text not null,
  sp jsonb not null default '[]'::jsonb,
  spi jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dskp_seed_keys (
  seed_key text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_rph_user_date on public.rph_records (user_id, tarikh desc);
create index if not exists idx_referensi_lookup on public.referensi_rph (subjek, tahun, bidang, sk);
create index if not exists idx_referensi_subjek on public.referensi_rph (subjek);
create index if not exists idx_referensi_tahun on public.referensi_rph (tahun);
create index if not exists idx_audit_created on public.audit_events (created_at desc);

-- Natural key including bidang (audit D-01/D-03): duplicates are impossible.
create unique index if not exists uq_referensi_natural_key
  on public.referensi_rph (subjek, tahun, coalesce(bidang, ''), sk);

-- Membership helpers read the per-request "app.user_id" setting (set by the API).
create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = nullif(current_setting('app.user_id', true), '')::uuid
      and p.status = 'active'
  );
$$;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = nullif(current_setting('app.user_id', true), '')::uuid
      and p.status = 'active'
      and p.role = 'admin'
  );
$$;

-- Unprivileged role used for every request-scoped query.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_user') then
    create role app_user nologin;
  end if;
end
$$;

do $$
begin
  execute format('grant app_user to %I', current_user);
end
$$;

grant usage on schema public to app_user;
grant select, insert, update, delete on public.rph_records to app_user;
grant select on public.referensi_rph to app_user;
grant select on public.profiles to app_user;
grant usage, select on all sequences in schema public to app_user;

alter table public.profiles enable row level security;
alter table public.rph_records enable row level security;
alter table public.referensi_rph enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to app_user
  using (id = nullif(current_setting('app.user_id', true), '')::uuid or public.is_active_admin());

drop policy if exists rph_select_self on public.rph_records;
create policy rph_select_self on public.rph_records
  for select to app_user
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid and public.is_active_member());

drop policy if exists rph_insert_self on public.rph_records;
create policy rph_insert_self on public.rph_records
  for insert to app_user
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid and public.is_active_member());

drop policy if exists rph_update_self on public.rph_records;
create policy rph_update_self on public.rph_records
  for update to app_user
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid and public.is_active_member())
  with check (user_id = nullif(current_setting('app.user_id', true), '')::uuid and public.is_active_member());

drop policy if exists rph_delete_self on public.rph_records;
create policy rph_delete_self on public.rph_records
  for delete to app_user
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid and public.is_active_member());

drop policy if exists dskp_select_member on public.referensi_rph;
create policy dskp_select_member on public.referensi_rph
  for select to app_user
  using (public.is_active_member());

-- Column grants: app_user may only rename itself, never touch role/status.
revoke insert, update, delete on public.profiles from app_user;
grant update (name, email, updated_at) on public.profiles to app_user;

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to app_user
  using (id = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (id = nullif(current_setting('app.user_id', true), '')::uuid);

-- Privileged admin operations (role/status, DSKP writes, audit) run through these
-- SECURITY DEFINER functions, and each checks the caller is an active admin.
create or replace function public.admin_set_membership(
  p_target uuid,
  p_role text default null,
  p_status text default null
) returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.profiles;
begin
  if not public.is_active_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_role is not null and p_role not in ('teacher', 'admin') then
    raise exception 'INVALID_ROLE' using errcode = '22023';
  end if;
  if p_status is not null and p_status not in ('pending', 'active', 'disabled') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;

  update public.profiles
     set role = coalesce(p_role, role),
         status = coalesce(p_status, status),
         updated_at = now()
   where id = p_target
  returning * into v_row;

  if v_row.id is null then
    raise exception 'NOT_FOUND' using errcode = '02000';
  end if;

  insert into public.audit_events (actor_id, action, entity, entity_id, detail)
  values (nullif(current_setting('app.user_id', true), '')::uuid, 'membership.update', 'profiles', p_target::text,
          jsonb_build_object('role', v_row.role, 'status', v_row.status));

  return v_row;
end
$$;

create or replace function public.admin_upsert_dskp(
  p_id uuid,
  p_subjek text,
  p_tahun integer,
  p_bidang text,
  p_sk text,
  p_sp jsonb,
  p_spi jsonb
) returns public.referensi_rph
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.referensi_rph;
begin
  if not public.is_active_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  insert into public.referensi_rph (id, subjek, tahun, bidang, sk, sp, spi)
  values (coalesce(p_id, gen_random_uuid()), p_subjek, p_tahun, nullif(p_bidang, ''), p_sk,
          coalesce(p_sp, '[]'::jsonb), coalesce(p_spi, '[]'::jsonb))
  on conflict (id) do update
     set subjek = excluded.subjek,
         tahun = excluded.tahun,
         bidang = excluded.bidang,
         sk = excluded.sk,
         sp = excluded.sp,
         spi = excluded.spi,
         updated_at = now()
  returning * into v_row;

  insert into public.audit_events (actor_id, action, entity, entity_id, detail)
  values (nullif(current_setting('app.user_id', true), '')::uuid, 'dskp.upsert', 'referensi_rph', v_row.id::text,
          jsonb_build_object('subjek', v_row.subjek, 'tahun', v_row.tahun, 'sk', v_row.sk));

  return v_row;
end
$$;

create or replace function public.admin_delete_dskp(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  delete from public.referensi_rph where id = p_id;
  if not found then
    return false;
  end if;

  insert into public.audit_events (actor_id, action, entity, entity_id)
  values (nullif(current_setting('app.user_id', true), '')::uuid, 'dskp.delete', 'referensi_rph', p_id::text);
  return true;
end
$$;

-- Request-scoped writes that are not covered by plain table grants.
create or replace function public.upsert_self_profile(p_email text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := nullif(current_setting('app.user_id', true), '')::uuid;
  v_row public.profiles;
begin
  if v_id is null then
    raise exception 'UNAUTHORIZED' using errcode = '42501';
  end if;

  insert into public.profiles (id, email, name, role, status)
  values (v_id, lower(p_email), split_part(p_email, '@', 1), 'teacher', 'pending')
  on conflict (id) do update set email = lower(excluded.email), updated_at = now()
  returning * into v_row;

  return v_row;
end
$$;
