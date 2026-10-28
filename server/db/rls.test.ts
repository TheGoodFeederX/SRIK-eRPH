import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pool, withPrivileged, withUser } from './pool.js';

/**
 * Database-level access control (audit S-01, S-02, TC-NEON-RLS-01/02, TC-NEON-AUTH-02).
 * Runs only when DATABASE_URL points at the Neon database with migrations applied.
 */
const enabled = Boolean(process.env.DATABASE_URL);
const teacherId = randomUUID();
const adminId = randomUUID();
const emails = [`rls-teacher-${teacherId}@example.invalid`, `rls-admin-${adminId}@example.invalid`];
const testSk = `RLS test SK ${teacherId}`;

describe.skipIf(!enabled)('row level security', () => {
  beforeAll(async () => {
    await withPrivileged((db) => db.query('delete from public.referensi_rph where sk like $1', ['RLS test SK%']));
  });

  const activate = (id: string, role: 'teacher' | 'admin') =>
    withPrivileged((db) =>
      db.query("update public.profiles set status = 'active', role = $2 where id = $1", [id, role]),
    );

  it('creates a pending profile for a new account and denies all data access', async () => {
    const created = await withUser(teacherId, (db) =>
      db.query('select * from public.upsert_self_profile($1)', [emails[0]]),
    );
    expect(created.rows[0].status).toBe('pending');

    const visible = await withUser(teacherId, (db) =>
      db.query('select count(*)::int as count from public.referensi_rph'),
    );
    expect(visible.rows[0].count).toBe(0);

    await expect(
      withUser(teacherId, (db) =>
        db.query(
          "insert into public.rph_records (user_id, tarikh, hari, tahun, kelas, masa, subjek) values ($1, '2026-10-27', 'Selasa', 3, '3A', '8-9', 'Sains')",
          [teacherId],
        ),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it('lets an active teacher own records but not write DSKP', async () => {
    await activate(teacherId, 'teacher');

    const inserted = await withUser(teacherId, (db) =>
      db.query(
        "insert into public.rph_records (user_id, tarikh, hari, tahun, kelas, masa, subjek) values ($1, '2026-10-27', 'Selasa', 3, '3A', '8-9', 'Sains') returning id",
        [teacherId],
      ),
    );
    expect(inserted.rows).toHaveLength(1);

    await expect(
      withUser(teacherId, (db) =>
        db.query('select public.admin_upsert_dskp(null, $1, 1, null, $2, null, null)', ['Sains', testSk]),
      ),
    ).rejects.toThrow(/FORBIDDEN/);

    await expect(
      withUser(teacherId, (db) => db.query("update public.profiles set role = 'admin' where id = $1", [teacherId])),
    ).rejects.toThrow(/permission denied/i);
  });

  it('lets an active admin manage DSKP and memberships', async () => {
    await withUser(adminId, (db) => db.query('select public.upsert_self_profile($1)', [emails[1]]));
    await activate(adminId, 'admin');

    const dskp = await withUser(adminId, (db) =>
      db.query('select * from public.admin_upsert_dskp(null, $1, 1, null, $2, $3, $4) as row', [
        'Sains',
        testSk,
        JSON.stringify(['RLS test SP']),
        JSON.stringify([{ tp: 1, desc: 'RLS test SPI' }]),
      ]),
    );
    expect(dskp.rows[0].sk).toBe(testSk);

    // Duplicate natural key is rejected instead of duplicated (audit D-01/D-03).
    await expect(
      withUser(adminId, (db) =>
        db.query('select public.admin_upsert_dskp(null, $1, 1, null, $2, null, null)', ['Sains', testSk]),
      ),
    ).rejects.toThrow(/duplicate key/i);

    const membership = await withUser(adminId, (db) =>
      db.query('select * from public.admin_set_membership($1, $2, $3) as row', [teacherId, 'teacher', 'active']),
    );
    expect(membership.rows[0].status).toBe('active');
  });

  afterAll(async () => {
    if (!enabled) return;
    await withPrivileged(async (db) => {
      await db.query('delete from public.rph_records where user_id = any($1)', [[teacherId, adminId]]);
      await db.query('delete from public.referensi_rph where sk like $1', ['RLS test SK%']);
      await db.query('delete from public.profiles where id = any($1)', [[teacherId, adminId]]);
    });
    await pool.end();
  });
});
