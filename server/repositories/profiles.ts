import type { Profile, UserRole } from '../../src/types/index.js';
import type { Db } from '../db/pool.js';

interface Row {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: Profile['status'];
  created_at: string | Date;
  updated_at: string | Date;
}

const iso = (value: string | Date) => (value instanceof Date ? value.toISOString() : value);

const mapRow = (row: Row): Profile => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  status: row.status,
  created_at: iso(row.created_at),
  updated_at: iso(row.updated_at),
});

/** Callers run as app_user, so the database only lets them touch their own row. */
export async function renameProfile(db: Db, name: string) {
  const result = await db.query<Row>(
    'update public.profiles set name = $1, updated_at = now() where id = nullif(current_setting(\'app.user_id\', true), \'\')::uuid returning *',
    [name],
  );

  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function listMembers(db: Db) {
  const result = await db.query<Row>('select * from public.profiles order by status, role desc, name');
  return result.rows.map(mapRow);
}

/** Admin-only: role/status can never be changed by the account holder themselves. */
export async function setMembership(db: Db, id: string, role: UserRole | null, status: Profile['status'] | null) {
  const result = await db.query<Row>('select * from public.admin_set_membership($1, $2, $3) as row', [id, role, status]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
