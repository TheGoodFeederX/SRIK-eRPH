import { describe, expect, it } from 'vitest';
import { openDatabase } from './connection';
import { migrateAppSchema } from './schema';

describe('migrateAppSchema', () => {
  it('creates the app tables and indexes in SQLite', () => {
    const db = openDatabase(':memory:');

    try {
      migrateAppSchema(db);

      const tables = db
        .prepare(
          `
          select name
          from sqlite_master
          where type = 'table'
            and name in ('profiles', 'rph_records', 'referensi_rph')
          order by name
        `,
        )
        .all()
        .map((row) => (row as { name: string }).name);

      expect(tables).toEqual(['profiles', 'referensi_rph', 'rph_records']);

      const indexes = db
        .prepare(
          `
          select name
          from sqlite_master
          where type = 'index'
            and name in (
              'idx_rph_user_date',
              'idx_referensi_lookup',
              'idx_referensi_subjek',
              'idx_referensi_tahun'
            )
          order by name
        `,
        )
        .all()
        .map((row) => (row as { name: string }).name);

      expect(indexes).toEqual([
        'idx_referensi_lookup',
        'idx_referensi_subjek',
        'idx_referensi_tahun',
        'idx_rph_user_date',
      ]);

      const profilesSql = db
        .prepare("select sql from sqlite_master where type = 'table' and name = 'profiles'")
        .get() as { sql: string };
      expect(profilesSql.sql).toContain("role text not null check (role in ('teacher', 'admin')) default 'teacher'");

      const rphColumns = db.prepare("pragma table_info('rph_records')").all() as Array<{
        name: string;
        notnull: 0 | 1;
        dflt_value: string | null;
      }>;
      expect(rphColumns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'user_id', notnull: 1 }),
          expect.objectContaining({ name: 'tarikh', notnull: 1 }),
          expect.objectContaining({ name: 'hari', notnull: 1 }),
          expect.objectContaining({ name: 'tahun', notnull: 1 }),
          expect.objectContaining({ name: 'kelas', notnull: 1 }),
          expect.objectContaining({ name: 'masa', notnull: 1 }),
          expect.objectContaining({ name: 'subjek', notnull: 1 }),
          expect.objectContaining({ name: 'content', notnull: 1, dflt_value: "'{}'" }),
        ]),
      );

      const rphIndexSql = db
        .prepare("select sql from sqlite_master where type = 'index' and name = 'idx_rph_user_date'")
        .get() as { sql: string };
      expect(rphIndexSql.sql.toLowerCase()).toContain('tarikh desc');

      const dskpColumns = db.prepare("pragma table_info('referensi_rph')").all() as Array<{
        name: string;
        notnull: 0 | 1;
        dflt_value: string | null;
      }>;
      expect(dskpColumns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'sp', notnull: 1, dflt_value: "'[]'" }),
          expect.objectContaining({ name: 'spi', notnull: 1, dflt_value: "'[]'" }),
          expect.objectContaining({ name: 'created_at', notnull: 1 }),
          expect.objectContaining({ name: 'updated_at', notnull: 1 }),
        ]),
      );

      const rphForeignKeys = db.prepare("pragma foreign_key_list('rph_records')").all() as Array<{
        table: string;
        from: string;
        to: string;
        on_delete: string;
      }>;
      expect(rphForeignKeys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            table: 'profiles',
            from: 'user_id',
            to: 'id',
            on_delete: 'CASCADE',
          }),
        ]),
      );
    } finally {
      db.close();
    }
  });
});
