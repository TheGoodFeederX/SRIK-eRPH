import type { ReferensiRPH } from '../../src/types';
import type { Db } from '../db/pool';
import { likeTerm } from './rph-records';

interface Row {
  id: string;
  subjek: string;
  tahun: number;
  bidang: string | null;
  sk: string;
  sp: string[];
  spi: Array<{ tp: number; desc: string }>;
  created_at: string | Date;
  updated_at: string | Date;
}

const iso = (value: string | Date) => (value instanceof Date ? value.toISOString() : value);

const mapRow = (row: Row): ReferensiRPH => ({
  id: row.id,
  subjek: row.subjek,
  tahun: row.tahun,
  bidang: row.bidang,
  sk: row.sk,
  sp: Array.isArray(row.sp) ? row.sp : [],
  spi: Array.isArray(row.spi) ? row.spi : [],
  created_at: iso(row.created_at),
  updated_at: iso(row.updated_at),
});

export interface DskpQuery {
  page: number;
  pageSize: number;
  search?: string;
  subjek?: string;
  tahun?: number;
}

export async function listDskp(db: Db, query: DskpQuery) {
  const params: unknown[] = [];
  const filters: string[] = [];

  if (query.search) {
    params.push(likeTerm(query.search));
    filters.push(`(subjek ilike $${params.length} escape '\\' or sk ilike $${params.length} escape '\\' or coalesce(bidang, '') ilike $${params.length} escape '\\')`);
  }
  if (query.subjek) {
    params.push(query.subjek);
    filters.push(`subjek = $${params.length}`);
  }
  if (query.tahun !== undefined) {
    params.push(query.tahun);
    filters.push(`tahun = $${params.length}`);
  }

  const where = filters.length ? `where ${filters.join(' and ')}` : '';
  params.push(query.pageSize, (query.page - 1) * query.pageSize);

  const result = await db.query<Row & { total_count: string }>(
    `select *, count(*) over() as total_count
       from public.referensi_rph
      ${where}
      order by subjek, tahun, coalesce(bidang, ''), sk
      limit $${params.length - 1} offset $${params.length}`,
    params,
  );

  return {
    data: result.rows.map(mapRow),
    totalCount: Number(result.rows[0]?.total_count ?? 0),
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getDskpMeta(db: Db) {
  const result = await db.query<{ subjek: string; tahun: number }>(
    'select distinct subjek, tahun from public.referensi_rph order by subjek, tahun',
  );

  return {
    subjects: [...new Set(result.rows.map((row) => row.subjek))],
    years: [...new Set(result.rows.map((row) => row.tahun))].sort((a, b) => a - b),
  };
}

export interface DskpInput {
  subjek: string;
  tahun: number;
  bidang?: string | null;
  sk: string;
  sp: string[];
  spi: Array<{ tp: number; desc: string }>;
}

/** Admin-only; the SQL function re-checks `is_active_admin()` (audit S-01). */
export async function upsertDskp(db: Db, id: string | null, input: DskpInput) {
  const result = await db.query<Row>(
    'select * from public.admin_upsert_dskp($1, $2, $3, $4, $5, $6, $7) as row',
    [
      id,
      input.subjek,
      input.tahun,
      input.bidang ?? null,
      input.sk,
      JSON.stringify(input.sp ?? []),
      JSON.stringify(input.spi ?? []),
    ],
  );

  return mapRow(result.rows[0]);
}

export async function deleteDskp(db: Db, id: string) {
  const result = await db.query<{ admin_delete_dskp: boolean }>('select public.admin_delete_dskp($1)', [id]);
  return result.rows[0]?.admin_delete_dskp ?? false;
}
