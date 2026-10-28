import 'dotenv/config';
import { pool, withPrivileged } from './pool';

/**
 * Promotes an existing Neon Auth account to active admin.
 * The account must register first through the app; no passwords are created here.
 *
 *   pnpm seed:admin admin@sekolah.edu.my
 */
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: pnpm seed:admin <email>');
    process.exitCode = 1;
    return;
  }

  const result = await withPrivileged((db) =>
    db.query<{ id: string; email: string; role: string; status: string }>(
      `update public.profiles
          set role = 'admin', status = 'active', updated_at = now()
        where lower(email) = lower($1)
        returning id, email, role, status`,
      [email],
    ),
  );

  if (result.rows.length === 0) {
    console.error(`No profile for ${email}. Register the account in the app first, then re-run this command.`);
    process.exitCode = 1;
    return;
  }

  console.log('promoted:', result.rows[0]);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
