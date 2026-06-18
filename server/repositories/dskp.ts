import { nanoid } from 'nanoid';
import type { AppDatabase } from '../db/connection';
import type { PaginatedResponse, ReferensiRPH } from '../../src/types';

interface DskpRow {
  id: string;
  subjek: string;
  tahun: number;
  bidang: string | null;
  sk: string;
  sp: string;
  spi: string;
  created_at: string;
  updated_at: string;
}

interface DskpListQuery {
  page: number;
  pageSize: number;
  search?: string;
  subjek?: string;
  tahun?: number;
}

type SpiItem = { tp: number; desc: string };
type DskpCreateInput = Omit<ReferensiRPH, 'id' | 'created_at' | 'updated_at'>;
type DskpUpdateInput = Partial<Omit<ReferensiRPH, 'id'>>;

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function parseSpiArray(value: string): SpiItem[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is SpiItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { tp?: unknown }).tp === 'number' &&
        typeof (item as { desc?: unknown }).desc === 'string',
    );
  } catch {
    return [];
  }
}

function mapDskpRow(row: DskpRow): ReferensiRPH {
  return {
    id: row.id,
    subjek: row.subjek,
    tahun: row.tahun,
    bidang: row.bidang,
    sk: row.sk,
    sp: parseStringArray(row.sp),
    spi: parseSpiArray(row.spi),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function paginate<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResponse<T> {
  return {
    data,
    totalCount: total,
    page,
    pageSize,
  };
}

function normalizePositiveInteger(value: number, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(1, Math.trunc(value)));
}

function normalizePage(query: Pick<DskpListQuery, 'page' | 'pageSize'>): { page: number; pageSize: number; limit: number; offset: number } {
  const page = normalizePositiveInteger(query.page, 1);
  const pageSize = normalizePositiveInteger(query.pageSize, 10, 100);

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function listDskpRows(db: AppDatabase, query: DskpListQuery): PaginatedResponse<ReferensiRPH> {
  const pagination = normalizePage(query);
  const params: Record<string, string | number> = {
    limit: pagination.limit,
    offset: pagination.offset,
  };
  const filters: string[] = [];

  if (query.search?.trim()) {
    params.search = `%${query.search.trim()}%`;
    filters.push('(subjek like @search or bidang like @search or sk like @search)');
  }
  if (query.subjek?.trim()) {
    params.subjek = query.subjek.trim();
    filters.push('subjek = @subjek');
  }
  if (query.tahun !== undefined) {
    params.tahun = query.tahun;
    filters.push('tahun = @tahun');
  }

  const where = filters.length > 0 ? `where ${filters.join(' and ')}` : '';
  const totalRow = db.prepare(`select count(*) as total from referensi_rph ${where}`).get(params) as { total: number };
  const rows = db
    .prepare(
      `
      select id, subjek, tahun, bidang, sk, sp, spi, created_at, updated_at
      from referensi_rph
      ${where}
      order by subjek asc, tahun asc, bidang asc, sk asc
      limit @limit offset @offset
    `,
    )
    .all(params) as DskpRow[];

  return paginate(rows.map(mapDskpRow), totalRow.total, pagination.page, pagination.pageSize);
}

export function getDskpMetadata(db: AppDatabase): { subjects: string[]; years: number[] } {
  const subjects = db
    .prepare('select distinct subjek from referensi_rph order by subjek asc')
    .all()
    .map((row) => (row as { subjek: string }).subjek);
  const years = db
    .prepare('select distinct tahun from referensi_rph order by tahun asc')
    .all()
    .map((row) => (row as { tahun: number }).tahun);

  return { subjects, years };
}

export function getBidangOptions(db: AppDatabase, subjek: string, tahun: number): string[] {
  return db
    .prepare(
      `
      select distinct bidang
      from referensi_rph
      where subjek = ? and tahun = ? and bidang is not null and bidang <> ''
      order by bidang asc
    `,
    )
    .all(subjek, tahun)
    .map((row) => (row as { bidang: string }).bidang);
}

export function getSkOptions(db: AppDatabase, subjek: string, tahun: number, bidang?: string | null): string[] {
  const rows =
    bidang === undefined
      ? db
          .prepare('select distinct sk from referensi_rph where subjek = ? and tahun = ? order by sk asc')
          .all(subjek, tahun)
      : db
          .prepare(
            `
            select distinct sk
            from referensi_rph
            where subjek = ?
              and tahun = ?
              and (bidang = ? or (bidang is null and ? is null))
            order by sk asc
          `,
          )
          .all(subjek, tahun, bidang, bidang);

  return rows.map((row) => (row as { sk: string }).sk);
}

export function getDskpDetail(
  db: AppDatabase,
  input: { subjek: string; tahun: number; bidang?: string | null; sk: string },
): Pick<ReferensiRPH, 'sp' | 'spi'> | null {
  const row = db
    .prepare(
      `
      select sp, spi
      from referensi_rph
      where subjek = @subjek
        and tahun = @tahun
        and sk = @sk
        and (
          @hasBidang = 0
          or bidang = @bidang
          or (bidang is null and @bidang is null)
        )
      order by bidang asc
      limit 1
    `,
    )
    .get({
      subjek: input.subjek,
      tahun: input.tahun,
      sk: input.sk,
      hasBidang: input.bidang === undefined ? 0 : 1,
      bidang: input.bidang ?? null,
    }) as Pick<DskpRow, 'sp' | 'spi'> | undefined;

  return row ? { sp: parseStringArray(row.sp), spi: parseSpiArray(row.spi) } : null;
}

export function createDskpRow(db: AppDatabase, input: DskpCreateInput): ReferensiRPH {
  const row = db
    .prepare(
      `
      insert into referensi_rph (id, subjek, tahun, bidang, sk, sp, spi)
      values (@id, @subjek, @tahun, @bidang, @sk, @sp, @spi)
      returning id, subjek, tahun, bidang, sk, sp, spi, created_at, updated_at
    `,
    )
    .get({
      id: nanoid(),
      subjek: input.subjek,
      tahun: input.tahun,
      bidang: input.bidang ?? null,
      sk: input.sk,
      sp: JSON.stringify(input.sp),
      spi: JSON.stringify(input.spi),
    }) as DskpRow;

  return mapDskpRow(row);
}

export function updateDskpRow(db: AppDatabase, id: string, input: DskpUpdateInput): ReferensiRPH | null {
  const updates: string[] = [];
  const params: Record<string, string | number | null> = { id };

  if (input.subjek !== undefined) {
    updates.push('subjek = @subjek');
    params.subjek = input.subjek;
  }
  if (input.tahun !== undefined) {
    updates.push('tahun = @tahun');
    params.tahun = input.tahun;
  }
  if (input.bidang !== undefined) {
    updates.push('bidang = @bidang');
    params.bidang = input.bidang ?? null;
  }
  if (input.sk !== undefined) {
    updates.push('sk = @sk');
    params.sk = input.sk;
  }
  if (input.sp !== undefined) {
    updates.push('sp = @sp');
    params.sp = JSON.stringify(input.sp);
  }
  if (input.spi !== undefined) {
    updates.push('spi = @spi');
    params.spi = JSON.stringify(input.spi);
  }

  if (updates.length === 0) {
    const row = db
      .prepare('select id, subjek, tahun, bidang, sk, sp, spi, created_at, updated_at from referensi_rph where id = @id')
      .get(params) as DskpRow | undefined;
    return row ? mapDskpRow(row) : null;
  }

  updates.push("updated_at = datetime('now')");

  const row = db
    .prepare(
      `
      update referensi_rph
      set ${updates.join(', ')}
      where id = @id
      returning id, subjek, tahun, bidang, sk, sp, spi, created_at, updated_at
    `,
    )
    .get(params) as DskpRow | undefined;

  return row ? mapDskpRow(row) : null;
}

export function deleteDskpRow(db: AppDatabase, id: string): boolean {
  const result = db.prepare('delete from referensi_rph where id = ?').run(id);
  return result.changes > 0;
}
