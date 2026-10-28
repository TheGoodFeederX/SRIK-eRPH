import type { RPHRecord } from '../../src/types/index.js';
import type { Db } from '../db/pool.js';

interface Row {
  id: string;
  user_id: string;
  tarikh: string | Date;
  hari: string;
  tahun: number;
  kelas: string;
  masa: string;
  subjek: string;
  content: RPHRecord['content'];
  status: RPHRecord['status'];
  created_at: string | Date;
  updated_at: string | Date;
}

const iso = (value: string | Date) => (value instanceof Date ? value.toISOString() : value);

export function mapRow(row: Row): RPHRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    tarikh: iso(row.tarikh).slice(0, 10),
    hari: row.hari,
    tahun: row.tahun,
    kelas: row.kelas,
    masa: row.masa,
    subjek: row.subjek,
    content: row.content ?? {},
    status: row.status ?? 'draft',
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

/** Escapes LIKE metacharacters so user input cannot rewrite the filter (audit F-05). */
export const likeTerm = (term: string) => `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;


export interface ListQuery {
  page: number;
  pageSize: number;
  search: string;
}

export async function listRecords(db: Db, userId: string, query: ListQuery) {
  const offset = (query.page - 1) * query.pageSize;
  const params: unknown[] = [userId];

  let filter = '';
  if (query.search) {
    params.push(likeTerm(query.search));
    filter = `and (subjek ilike $2 escape '\\' or kelas ilike $2 escape '\\' or hari ilike $2 escape '\\' or masa ilike $2 escape '\\')`;
  }
  params.push(query.pageSize, offset);

  const result = await db.query<Row & { total_count: string }>(
    `select *, count(*) over() as total_count
       from public.rph_records
      where user_id = $1 ${filter}
      order by tarikh desc, created_at desc
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

export interface RecordInput {
  tarikh: string;
  hari: string;
  tahun: number;
  kelas: string;
  masa: string;
  subjek: string;
  content: RPHRecord['content'];
  status?: RPHRecord['status'];
}

export async function createRecord(db: Db, userId: string, input: RecordInput) {
  const result = await db.query<Row>(
    `insert into public.rph_records (user_id, tarikh, hari, tahun, kelas, masa, subjek, content, status)
     values ($1, $2, $3, $4, $5, $6, $7, $8, coalesce($9, 'draft'))
     returning *`,
    [
      userId,
      input.tarikh,
      input.hari,
      input.tahun,
      input.kelas,
      input.masa,
      input.subjek,
      JSON.stringify(input.content ?? {}),
      input.status ?? null,
    ],
  );

  return mapRow(result.rows[0]);
}

export async function updateRecord(db: Db, id: string, input: Partial<RecordInput>) {
  const fields: string[] = [];
  const params: unknown[] = [id];

  const push = (column: string, value: unknown) => {
    params.push(value);
    fields.push(`${column} = $${params.length}`);
  };

  if (input.tarikh !== undefined) push('tarikh', input.tarikh);
  if (input.hari !== undefined) push('hari', input.hari);
  if (input.tahun !== undefined) push('tahun', input.tahun);
  if (input.kelas !== undefined) push('kelas', input.kelas);
  if (input.masa !== undefined) push('masa', input.masa);
  if (input.subjek !== undefined) push('subjek', input.subjek);
  if (input.content !== undefined) push('content', JSON.stringify(input.content));
  if (input.status !== undefined) push('status', input.status);

  if (fields.length === 0) {
    return null;
  }

  const result = await db.query<Row>(
    `update public.rph_records
        set ${fields.join(', ')}, updated_at = now()
      where id = $1
      returning *`,
    params,
  );

  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function deleteRecord(db: Db, id: string) {
  const result = await db.query('delete from public.rph_records where id = $1 returning id', [id]);
  return result.rowCount === 1;
}
