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
