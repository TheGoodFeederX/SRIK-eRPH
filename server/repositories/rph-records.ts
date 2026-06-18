import { nanoid } from 'nanoid';
import type { AppDatabase } from '../db/connection';
import type { PaginatedResponse, RPHRecord } from '../../src/types';

interface RphRecordRow {
  id: string;
  user_id: string;
  tarikh: string;
  hari: string;
  tahun: number;
  kelas: string;
  masa: string;
  subjek: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface RphListQuery {
  page: number;
  pageSize: number;
  search?: string;
}

type RphCreateInput = Omit<RPHRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
type RphUpdateInput = Partial<Omit<RPHRecord, 'id' | 'user_id'>>;

function parseJsonObject(value: string): RPHRecord['content'] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as RPHRecord['content']) : {};
  } catch {
    return {};
  }
}

function mapRphRecord(row: RphRecordRow): RPHRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    tarikh: row.tarikh,
    hari: row.hari,
    tahun: row.tahun,
    kelas: row.kelas,
    masa: row.masa,
    subjek: row.subjek,
    content: parseJsonObject(row.content),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function requireTahun(tahun: number | undefined): number {
  if (tahun === undefined) {
    throw new Error('RPH record tahun is required.');
  }

  return tahun;
}

function paginate<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

function normalizePage(query: RphListQuery): { page: number; pageSize: number; limit: number; offset: number } {
  const page = Math.max(1, Math.trunc(query.page));
  const pageSize = Math.max(1, Math.trunc(query.pageSize));

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function listRphRecords(db: AppDatabase, userId: string, query: RphListQuery): PaginatedResponse<RPHRecord> {
  const pagination = normalizePage(query);
  const params: Record<string, string | number> = {
    userId,
    limit: pagination.limit,
    offset: pagination.offset,
  };
  const filters = ['user_id = @userId'];

  if (query.search?.trim()) {
    params.search = `%${query.search.trim()}%`;
    filters.push('(tarikh like @search or hari like @search or kelas like @search or subjek like @search)');
  }

  const where = filters.join(' and ');
  const totalRow = db.prepare(`select count(*) as total from rph_records where ${where}`).get(params) as { total: number };
  const rows = db
    .prepare(
      `
      select id, user_id, tarikh, hari, tahun, kelas, masa, subjek, content, created_at, updated_at
      from rph_records
      where ${where}
      order by tarikh desc, created_at desc
      limit @limit offset @offset
    `,
    )
    .all(params) as RphRecordRow[];

  return paginate(rows.map(mapRphRecord), totalRow.total, pagination.page, pagination.pageSize);
}

export function createRphRecord(db: AppDatabase, userId: string, input: RphCreateInput): RPHRecord {
  const row = db
    .prepare(
      `
      insert into rph_records (id, user_id, tarikh, hari, tahun, kelas, masa, subjek, content)
      values (@id, @userId, @tarikh, @hari, @tahun, @kelas, @masa, @subjek, @content)
      returning id, user_id, tarikh, hari, tahun, kelas, masa, subjek, content, created_at, updated_at
    `,
    )
    .get({
      id: nanoid(),
      userId,
      tarikh: input.tarikh,
      hari: input.hari,
      tahun: requireTahun(input.tahun),
      kelas: input.kelas,
      masa: input.masa,
      subjek: input.subjek,
      content: JSON.stringify(input.content ?? {}),
    }) as RphRecordRow;

  return mapRphRecord(row);
}

export function updateRphRecord(
  db: AppDatabase,
  userId: string,
  id: string,
  input: RphUpdateInput,
): RPHRecord | null {
  const updates: string[] = [];
  const params: Record<string, string | number> = { id, userId };

  if (input.tarikh !== undefined) {
    updates.push('tarikh = @tarikh');
    params.tarikh = input.tarikh;
  }
  if (input.hari !== undefined) {
    updates.push('hari = @hari');
    params.hari = input.hari;
  }
  if (input.tahun !== undefined) {
    updates.push('tahun = @tahun');
    params.tahun = input.tahun;
  }
  if (input.kelas !== undefined) {
    updates.push('kelas = @kelas');
    params.kelas = input.kelas;
  }
  if (input.masa !== undefined) {
    updates.push('masa = @masa');
    params.masa = input.masa;
  }
  if (input.subjek !== undefined) {
    updates.push('subjek = @subjek');
    params.subjek = input.subjek;
  }
  if (input.content !== undefined) {
    updates.push('content = @content');
    params.content = JSON.stringify(input.content);
  }

  if (updates.length === 0) {
    const row = db
      .prepare(
        `
        select id, user_id, tarikh, hari, tahun, kelas, masa, subjek, content, created_at, updated_at
        from rph_records
        where id = @id and user_id = @userId
      `,
      )
      .get(params) as RphRecordRow | undefined;
    return row ? mapRphRecord(row) : null;
  }

  updates.push("updated_at = datetime('now')");

  const row = db
    .prepare(
      `
      update rph_records
      set ${updates.join(', ')}
      where id = @id and user_id = @userId
      returning id, user_id, tarikh, hari, tahun, kelas, masa, subjek, content, created_at, updated_at
    `,
    )
    .get(params) as RphRecordRow | undefined;

  return row ? mapRphRecord(row) : null;
}

export function deleteRphRecord(db: AppDatabase, userId: string, id: string): boolean {
  const result = db.prepare('delete from rph_records where id = ? and user_id = ?').run(id, userId);
  return result.changes > 0;
}
