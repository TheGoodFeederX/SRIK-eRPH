import type { AppDatabase } from '../db/connection';
import type { Profile, UserRole } from '../../src/types';

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function requireProfile(row: ProfileRow | undefined): Profile {
  if (!row) {
    throw new Error('Profile not found.');
  }

  return mapProfile(row);
}

export function upsertProfile(
  db: AppDatabase,
  input: { id: string; email: string; name: string; role?: UserRole },
): Profile {
  const row = db
    .prepare(
      `
      insert into profiles (id, email, name, role)
      values (@id, @email, @name, @role)
      on conflict(id) do update set
        email = excluded.email,
        name = excluded.name,
        role = excluded.role,
        updated_at = datetime('now')
      returning id, email, name, role, created_at, updated_at
    `,
    )
    .get({ ...input, role: input.role ?? 'teacher' }) as ProfileRow | undefined;

  return requireProfile(row);
}

export function getProfile(db: AppDatabase, id: string): Profile | null {
  const row = db
    .prepare('select id, email, name, role, created_at, updated_at from profiles where id = ?')
    .get(id) as ProfileRow | undefined;

  return row ? mapProfile(row) : null;
}

export function updateProfileName(db: AppDatabase, id: string, name: string): Profile {
  const row = db
    .prepare(
      `
      update profiles
      set name = ?, updated_at = datetime('now')
      where id = ?
      returning id, email, name, role, created_at, updated_at
    `,
    )
    .get(name, id) as ProfileRow | undefined;

  return requireProfile(row);
}

export function setAdminRole(db: AppDatabase, email: string): Profile {
  const row = db
    .prepare(
      `
      update profiles
      set role = 'admin', updated_at = datetime('now')
      where email = ?
      returning id, email, name, role, created_at, updated_at
    `,
    )
    .get(email) as ProfileRow | undefined;

  return requireProfile(row);
}
