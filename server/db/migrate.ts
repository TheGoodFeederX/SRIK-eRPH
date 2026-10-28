import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, withPrivileged } from './pool';

const sqlDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sql');

/**
 * Applies every .sql file in server/db/sql in name order inside one transaction.
 * Files are written idempotently (if not exists / drop policy) so re-running is safe.
 */
export async function migrate(): Promise<string[]> {
  const files = fs.readdirSync(sqlDir).filter((file) => file.endsWith('.sql')).sort();
  const applied: string[] = [];

  for (const file of files) {
    const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
    await withPrivileged(async (db) => {
      await db.query(sql);
    });
    applied.push(file);
  }

  return applied;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then((files) => {
      console.log(`migrated: ${files.join(', ')}`);
      return pool.end();
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
      return pool.end();
    });
}
