import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required (Neon PostgreSQL connection string).');
}

export const pool = new pg.Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX ?? 5),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

export type Db = Pick<pg.PoolClient, 'query'>;

/**
 * Runs queries as the unprivileged `app_user` role with `app.user_id` set, so the
 * database enforces ownership/role rules through RLS on top of the API checks.
 */
export async function withUser<T>(userId: string, fn: (db: Db) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query("select set_config('app.user_id', $1, true)", [userId]);
    await client.query('set local role app_user');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/** Owner-level access for migrations and seeds only. Never used for app requests. */
export async function withPrivileged<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  return fn(pool);
}
