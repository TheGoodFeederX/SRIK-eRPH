import { describe, expect, it } from 'vitest';
import { openDatabase } from '../db/connection';
import { migrateAppSchema } from '../db/schema';
import { seedDskp } from '../db/seed-dskp';
import { listDskpRows } from './dskp';
import { listRphRecords } from './rph-records';
import { upsertProfile } from './profiles';

function createTestDatabase() {
  const db = openDatabase(':memory:');
  migrateAppSchema(db);
  return db;
}

describe('repositories', () => {
  it('normalizes invalid pagination before querying SQLite', () => {
    const db = createTestDatabase();

    try {
      upsertProfile(db, { id: 'user-1', email: 'teacher@example.com', name: 'Teacher' });

      const rphResult = listRphRecords(db, 'user-1', {
        page: Number.NaN,
        pageSize: Number.POSITIVE_INFINITY,
      });
      const dskpResult = listDskpRows(db, {
        page: Number.NaN,
        pageSize: Number.POSITIVE_INFINITY,
      });

      expect(rphResult).toMatchObject({ data: [], totalCount: 0, page: 1, pageSize: 10 });
      expect(dskpResult).toMatchObject({ data: [], totalCount: 0, page: 1, pageSize: 10 });
    } finally {
      db.close();
    }
  });

  it('seeds DSKP rows idempotently without deleting custom rows', () => {
    const db = createTestDatabase();

    try {
      seedDskp(db);
      const firstSeedIds = db
        .prepare('select id from referensi_rph order by id')
        .all()
        .map((row) => (row as { id: string }).id);

      db.prepare(
        `
        insert into referensi_rph (id, subjek, tahun, bidang, sk, sp, spi)
        values ('custom-row', 'Custom', 6, null, '9.9 Custom SK', '[]', '[]')
      `,
      ).run();

      seedDskp(db);
      const rows = db
        .prepare('select id, subjek from referensi_rph order by id')
        .all() as Array<{ id: string; subjek: string }>;
      const secondSeedIds = rows.filter((row) => row.id !== 'custom-row').map((row) => row.id);

      expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'custom-row', subjek: 'Custom' })]));
      expect(secondSeedIds).toEqual(firstSeedIds);
      expect(rows).toHaveLength(5);
    } finally {
      db.close();
    }
  });
});
