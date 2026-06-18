import Database from 'better-sqlite3';
import { betterAuth } from 'better-auth';

export function createAuth(databasePath: string) {
  return betterAuth({
    database: new Database(databasePath),
    emailAndPassword: {
      enabled: true,
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
