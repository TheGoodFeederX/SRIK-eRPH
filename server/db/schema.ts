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
      user_id text not null references profiles(id) on delete cascade,
      tarikh text not null,
      hari text not null,
      tahun integer not null,
      kelas text not null,
      masa text not null,
      subjek text not null,
      content text not null default '{}',
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    );

    create table if not exists referensi_rph (
      id text primary key,
      subjek text not null,
      tahun integer not null,
      bidang text,
      sk text not null,
      sp text not null default '[]',
      spi text not null default '[]',
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    );

    create index if not exists idx_rph_user_date
      on rph_records (user_id, tarikh desc);

    create index if not exists idx_referensi_lookup
      on referensi_rph (subjek, tahun, bidang, sk);

    create index if not exists idx_referensi_subjek
      on referensi_rph (subjek);

    create index if not exists idx_referensi_tahun
      on referensi_rph (tahun);
  `);
}
