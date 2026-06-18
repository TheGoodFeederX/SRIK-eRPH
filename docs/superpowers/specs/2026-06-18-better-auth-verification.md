# Better Auth Verification

Verified on 2026-06-18.

## Package Versions

- `better-auth`: 1.6.19
- `better-sqlite3`: 12.11.1
- `express`: 5.2.1
- Node.js: 24.16.0
- pnpm: 11.5.0

## Package Exports

Verified with:

```bash
node --input-type=module -e "import { betterAuth } from 'better-auth'; import { toNodeHandler, fromNodeHeaders } from 'better-auth/node'; import { createAuthClient } from 'better-auth/react'; console.log(typeof betterAuth, typeof toNodeHandler, typeof fromNodeHeaders, typeof createAuthClient)"
```

Output:

```text
function function function function
```

- `betterAuth` from `better-auth`: function
- `toNodeHandler` from `better-auth/node`: function
- `fromNodeHeaders` from `better-auth/node`: function
- `createAuthClient` from `better-auth/react`: function

## Express

- Express v5 route mount: `app.all('/api/auth/{*any}', toNodeHandler(auth))`
- `express.json()` must be mounted after the Better Auth handler.

## SQLite

- Runtime driver: `better-sqlite3`
- Auth config: `database: new Database(databasePath)`
- Native build scripts are approved in `pnpm-workspace.yaml` for `better-sqlite3` and `esbuild`.

## Client Methods

- `authClient.signIn.email`
- `authClient.signUp.email`
- `authClient.signOut`
- `authClient.changePassword`

## CLI

- `pnpm exec auth --help` is not available from the installed `better-auth` package.
- Working command: `pnpm dlx @better-auth/cli --help`
- Migration command to use after `server/auth.ts` exists: `pnpm dlx @better-auth/cli migrate`
