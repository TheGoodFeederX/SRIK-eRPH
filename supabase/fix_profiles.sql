-- Fix for missing profiles table that's referenced by auth trigger
-- This creates the profiles table and sets up the trigger properly

-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    email text,
    full_name text,
    name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create policy to allow users to read their own profile
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

-- Create policy to allow users to update their own profile
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id);

-- Create policy to allow users to insert their own profile (via trigger)
create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- Function to handle new user creation
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
    -- Log the error but don't fail user creation
    raise warning 'Error creating profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger on auth.users to automatically create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

-- Create index for better performance
create index if not exists idx_profiles_email on public.profiles(email);
