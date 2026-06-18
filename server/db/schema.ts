import type { AppDatabase } from './connection';

export function migrateAppSchema(db: AppDatabase): void {
  db.exec(`
    create table if not exists profiles (
      id text primary key,
      email text not null unique,
      name text not null,
      role text not null check (role in ('teacher', 'admin')) default 'teacher',
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now'))
    );

    create table if not exists rph_records (
      id text primary key,
      user_id text references profiles(id) on delete cascade,
      tarikh text,
      hari text,
      tahun integer not null,
      kelas text,
      masa text,
      subjek text,
      content text default '{}',
      created_at text default (datetime('now')),
      updated_at text default (datetime('now'))
    );

    create table if not exists referensi_rph (
      id text primary key,
      subjek text not null,
      tahun integer not null,
      bidang text,
      sk text not null,
      sp text default '[]',
      spi text default '[]',
      created_at text default (datetime('now')),
      updated_at text default (datetime('now'))
    );

    create index if not exists idx_rph_user_date
      on rph_records (user_id, tarikh);

    create index if not exists idx_referensi_lookup
      on referensi_rph (subjek, tahun, bidang, sk);

    create index if not exists idx_referensi_subjek
      on referensi_rph (subjek);

    create index if not exists idx_referensi_tahun
      on referensi_rph (tahun);
  `);
}
