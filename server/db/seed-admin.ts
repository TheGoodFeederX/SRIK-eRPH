import path from 'node:path';
import { openDatabase } from './connection';
import { migrateAppSchema } from './schema';
import { setAdminRole } from '../repositories/profiles';

function parseEmail(argv: string[]): string | null {
  const index = argv.indexOf('--email');
  if (index === -1) {
    return null;
  }

  return argv[index + 1] ?? null;
}

const email = parseEmail(process.argv.slice(2));
if (!email) {
  console.error('Usage: pnpm seed:admin -- --email <email>');
  process.exitCode = 1;
} else {
  const databasePath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data/erph.sqlite');
  const db = openDatabase(databasePath);

  try {
    migrateAppSchema(db);
    const profile = setAdminRole(db, email);
    console.log(`Updated profile: ${profile.email} (${profile.role})`);
  } finally {
    db.close();
  }
}
