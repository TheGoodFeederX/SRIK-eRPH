import Database from 'better-sqlite3';
import { betterAuth } from 'better-auth';

export function createAuth(databasePath: string, trustedOrigins: string[] = []) {
  return betterAuth({
    database: new Database(databasePath),
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
