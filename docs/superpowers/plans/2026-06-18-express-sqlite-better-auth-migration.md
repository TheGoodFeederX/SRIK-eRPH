# Express SQLite Better Auth Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the browser Supabase runtime with an Express API, Better Auth cookie sessions, and SQLite-backed application data while preserving the current teacher workflows.

**Architecture:** Add a `server/` runtime beside the existing Vite app. Better Auth owns `/api/auth/*`, Express owns app-specific `/api/*` routes, and React talks only to local API/client modules with `credentials: 'include'`.

**Tech Stack:** React 19, Vite 7, TypeScript, Express 5, Better Auth 1.6 docs, `better-sqlite3`, SQLite, Zod, Vitest, Supertest, Testing Library.

---

## Verified Better Auth Facts

Use these API names unless the installed package contradicts them during Task 1:

- `betterAuth` is imported from `better-auth`.
- `toNodeHandler` and `fromNodeHeaders` are imported from `better-auth/node`.
- Express v5 should mount Better Auth with `app.all('/api/auth/{*any}', toNodeHandler(auth))`.
- `express.json()` must be mounted after the Better Auth handler.
- SQLite can be configured as `database: new Database('database.sqlite')` using `better-sqlite3`.
- Sessions are read server-side with `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`.
- React client auth uses `createAuthClient` from `better-auth/react`.
- Email auth methods are `authClient.signIn.email(...)`, `authClient.signUp.email(...)`, `authClient.signOut()`, and `authClient.changePassword(...)`.
- Better Auth CLI supports SQLite schema generation/migration through `pnpm dlx @better-auth/cli migrate` or `pnpm dlx auth@latest migrate`; Task 1 must confirm the actual executable exposed by the installed package before scripts are finalized.

## Scope Split

This is a large migration. Execute the tasks in order. Each task should leave the app buildable or the specific failing tests documented by the task. Do not remove Supabase until Task 9, after the server API and frontend migration are covered by tests.

## File Structure

Create:

- `server/app.ts`: Express app factory, middleware order, Better Auth route mount, app routes, static serving.
- `server/index.ts`: process entrypoint.
- `server/auth.ts`: Better Auth configuration.
- `server/db/connection.ts`: shared SQLite connection factory.
- `server/db/schema.ts`: application migrations runner for `profiles`, `rph_records`, and `referensi_rph`.
- `server/db/seed-dskp.ts`: seed helper for DSKP data.
- `server/repositories/profiles.ts`: profile reads/updates and admin role update.
- `server/repositories/rph-records.ts`: owner-scoped RPH CRUD.
- `server/repositories/dskp.ts`: DSKP reads and admin mutations.
- `server/routes/auth.ts`: `/api/auth/me` and `/api/profile`.
- `server/routes/rph-records.ts`: RPH API routes.
- `server/routes/dskp.ts`: DSKP API routes.
- `server/routes/errors.ts`: shared error shape and Express error handler.
- `server/routes/session.ts`: session/role guards.
- `server/validation/schemas.ts`: Zod request schemas.
- `server/test/helpers.ts`: test app and auth/session helpers.
- `server/**/*.test.ts`: backend tests.
- `src/lib/apiClient.ts`: JSON request helper.
- `src/lib/authClient.ts`: Better Auth React client.
- `src/lib/dskpApi.ts`: DSKP API wrapper.
- `src/lib/rphApi.ts`: RPH API wrapper.
- `src/test/setup.ts`: jsdom setup.
- `src/**/*.test.tsx`: frontend regression tests.

Modify:

- `package.json`: scripts and dependencies.
- `vite.config.ts`: proxy `/api` to Express during development and test config.
- `tsconfig.node.json`: include `server/**/*.ts`.
- `src/types/index.ts`: add explicit `tahun`, profile, role, paginated response, and error types.
- `src/context/AuthContext.ts`: remove Supabase-derived types.
- `src/components/AuthContext.tsx`: derive auth state from `/api/auth/me`.
- `src/hooks/useRecords.ts`: call `rphApi`.
- `src/components/LoginPage.tsx`: call Better Auth client.
- `src/components/Settings.tsx`: use `/api/profile` and `authClient.changePassword`.
- `src/components/RPHForm.tsx`: persist and initialize `tahun`.
- `src/components/DSKPManager.tsx`: use DSKP API and admin role.
- `src/App.tsx`: remove Supabase credential checks and gate DSKP writes by role.
- `README.md`: document Express/SQLite/Better Auth setup.

## Task 1: Dependency And Better Auth Verification

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `docs/superpowers/specs/2026-06-18-better-auth-verification.md`

- [ ] **Step 1: Install server and test dependencies**

Run:

```bash
pnpm add express better-auth better-sqlite3 cors zod nanoid
pnpm add -D vitest supertest @testing-library/react @testing-library/user-event jsdom @types/express @types/cors @types/supertest @types/better-sqlite3 tsx concurrently
```

Expected: `package.json` and `pnpm-lock.yaml` include the new packages.

- [ ] **Step 2: Verify installed Better Auth exports**

Run:

```bash
node --input-type=module -e "import { betterAuth } from 'better-auth'; import { toNodeHandler, fromNodeHeaders } from 'better-auth/node'; import { createAuthClient } from 'better-auth/react'; console.log(typeof betterAuth, typeof toNodeHandler, typeof fromNodeHeaders, typeof createAuthClient)"
```

Expected: `function function function function`.

- [ ] **Step 3: Verify CLI command**

Run:

```bash
pnpm exec auth --help
```

If that fails, run:

```bash
pnpm dlx @better-auth/cli --help
```

Record the working migration command in the verification doc.

- [ ] **Step 4: Save verification notes**

Create `docs/superpowers/specs/2026-06-18-better-auth-verification.md`:

```markdown
# Better Auth Verification

Verified on 2026-06-18.

## Package Exports

- `betterAuth` from `better-auth`: function
- `toNodeHandler` from `better-auth/node`: function
- `fromNodeHeaders` from `better-auth/node`: function
- `createAuthClient` from `better-auth/react`: function

## Express

- Express v5 route mount: `app.all('/api/auth/{*any}', toNodeHandler(auth))`
- `express.json()` is mounted after the Better Auth handler.

## SQLite

- Runtime driver: `better-sqlite3`
- Auth config: `database: new Database(databasePath)`

## Client Methods

- `authClient.signIn.email`
- `authClient.signUp.email`
- `authClient.signOut`
- `authClient.changePassword`

## CLI

- Working command: `<replace with exact verified command>`
```

- [ ] **Step 5: Commit**

Run:

```bash
git add package.json pnpm-lock.yaml docs/superpowers/specs/2026-06-18-better-auth-verification.md
git commit -m "chore: verify better auth dependencies"
```

## Task 2: Test Harness And Server Skeleton

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `server/app.ts`
- Create: `server/index.ts`
- Create: `server/routes/errors.ts`
- Create: `server/app.test.ts`

- [ ] **Step 1: Add scripts**

Update `package.json` scripts:

```json
{
  "dev": "concurrently \"vite --host\" \"tsx watch server/index.ts\"",
  "dev:client": "vite --host",
  "dev:server": "tsx watch server/index.ts",
  "server": "tsx server/index.ts",
  "test": "vitest run",
  "test:watch": "vitest",
  "build": "tsc -b && vite build",
  "lint": "eslint ."
}
```

- [ ] **Step 2: Add Vite proxy and Vitest config**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['erph.zulnajmi.my'],
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
```

- [ ] **Step 3: Write failing smoke test**

Create `server/app.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('server app', () => {
  it('responds on /api/health', async () => {
    const app = createApp({ databasePath: ':memory:', staticDir: null });
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
```

Run:

```bash
pnpm test server/app.test.ts
```

Expected: FAIL because `server/app.ts` does not exist.

- [ ] **Step 4: Implement Express app skeleton**

Create `server/routes/errors.ts`:

```ts
import type { ErrorRequestHandler, RequestHandler } from 'express';

export type ApiErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', 'Route not found.'));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }

  console.error(error);
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected server error.' } });
};
```

Create `server/app.ts`:

```ts
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './routes/errors';

export interface CreateAppOptions {
  databasePath?: string;
  staticDir?: string | null;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use(express.json({ limit: '1mb' }));

  if (options.staticDir) {
    app.use(express.static(options.staticDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(options.staticDir as string, 'index.html'));
    });
  }

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}
```

Create `server/index.ts`:

```ts
import path from 'node:path';
import { createApp } from './app';

const port = Number(process.env.PORT ?? 3005);
const databasePath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data/erph.sqlite');
const staticDir = process.env.NODE_ENV === 'production' ? path.resolve(process.cwd(), 'dist') : null;

createApp({ databasePath, staticDir }).listen(port, () => {
  console.log(`eRPH server listening on ${port}`);
});
```

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test server/app.test.ts
pnpm build
```

Expected: smoke test passes and TypeScript build passes.

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json pnpm-lock.yaml vite.config.ts server
git commit -m "feat: add express server skeleton"
```

## Task 3: SQLite Schema, Repositories, And Seed Script

**Files:**
- Create: `server/db/connection.ts`
- Create: `server/db/schema.ts`
- Create: `server/db/seed-dskp.ts`
- Create: `server/repositories/profiles.ts`
- Create: `server/repositories/rph-records.ts`
- Create: `server/repositories/dskp.ts`
- Create: `server/db/schema.test.ts`
- Modify: `src/types/index.ts`
- Modify: `package.json`

- [ ] **Step 1: Write schema test**

Create `server/db/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { openDatabase } from './connection';
import { migrateAppSchema } from './schema';

describe('SQLite app schema', () => {
  it('creates app tables and indexes', () => {
    const db = openDatabase(':memory:');
    migrateAppSchema(db);

    const tables = db.prepare("select name from sqlite_master where type = 'table' order by name").all() as Array<{ name: string }>;
    expect(tables.map((table) => table.name)).toContain('profiles');
    expect(tables.map((table) => table.name)).toContain('rph_records');
    expect(tables.map((table) => table.name)).toContain('referensi_rph');

    const indexes = db.prepare("select name from sqlite_master where type = 'index' order by name").all() as Array<{ name: string }>;
    expect(indexes.map((index) => index.name)).toContain('idx_rph_user_date');
    expect(indexes.map((index) => index.name)).toContain('idx_referensi_lookup');
  });
});
```

Run:

```bash
pnpm test server/db/schema.test.ts
```

Expected: FAIL because the DB modules do not exist.

- [ ] **Step 2: Implement DB connection and schema**

Create `server/db/connection.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export type AppDatabase = Database.Database;

export function openDatabase(databasePath: string): AppDatabase {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new Database(databasePath);
  db.pragma('foreign_keys = ON');
  return db;
}
```

Create `server/db/schema.ts` with the SQL from the approved spec:

```ts
import type { AppDatabase } from './connection';

export function migrateAppSchema(db: AppDatabase) {
  db.exec(`
    create table if not exists profiles (
      id text primary key,
      email text not null unique,
      name text not null,
      role text not null check (role in ('teacher', 'admin')) default 'teacher',
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    );

    create table if not exists rph_records (
      id text primary key,
      user_id text not null references profiles(id) on delete cascade,
      tarikh text not null,
      hari text not null,
      tahun integer not null,
      kelas text not null,
      masa text not null,
      subjek text not null,
      content text not null default '{}',
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    );

    create table if not exists referensi_rph (
      id text primary key,
      subjek text not null,
      tahun integer not null,
      bidang text,
      sk text not null,
      sp text not null default '[]',
      spi text not null default '[]',
      created_at text not null default CURRENT_TIMESTAMP,
      updated_at text not null default CURRENT_TIMESTAMP
    );

    create index if not exists idx_rph_user_date on rph_records(user_id, tarikh desc);
    create index if not exists idx_referensi_lookup on referensi_rph(subjek, tahun, bidang, sk);
    create index if not exists idx_referensi_subjek on referensi_rph(subjek);
    create index if not exists idx_referensi_tahun on referensi_rph(tahun);
  `);
}
```

- [ ] **Step 3: Update shared types**

Update `src/types/index.ts`:

```ts
export type UserRole = 'teacher' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface RPHRecord {
  id: string;
  user_id: string;
  tarikh: string;
  hari: string;
  tahun: number;
  kelas: string;
  masa: string;
  subjek: string;
  content: {
    bidang?: string;
    tajukStandardKandungan?: string;
    objektif?: string;
    aktiviti?: string;
    refleksi?: string;
    sp?: string[];
    spi?: Array<{ tp: number; desc: string }>;
  };
  status?: 'draft' | 'published';
  created_at?: string;
  updated_at?: string;
}

export interface ReferensiRPH {
  id: string;
  subjek: string;
  tahun: number;
  bidang?: string | null;
  sk: string;
  sp: string[];
  spi: Array<{ tp: number; desc: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export type Tab = 'form' | 'records' | 'dskp' | 'settings';
```

- [ ] **Step 4: Implement repositories**

Implement repository modules with prepared statements and JSON parse/stringify at boundaries. Required exported functions:

```ts
// server/repositories/profiles.ts
export function upsertProfile(db: AppDatabase, input: { id: string; email: string; name: string; role?: UserRole }): Profile;
export function getProfile(db: AppDatabase, id: string): Profile | null;
export function updateProfileName(db: AppDatabase, id: string, name: string): Profile;
export function setAdminRole(db: AppDatabase, email: string): Profile;

// server/repositories/rph-records.ts
export function listRphRecords(db: AppDatabase, userId: string, query: { page: number; pageSize: number; search?: string }): PaginatedResponse<RPHRecord>;
export function createRphRecord(db: AppDatabase, userId: string, input: Omit<RPHRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>): RPHRecord;
export function updateRphRecord(db: AppDatabase, userId: string, id: string, input: Partial<Omit<RPHRecord, 'id' | 'user_id'>>): RPHRecord | null;
export function deleteRphRecord(db: AppDatabase, userId: string, id: string): boolean;

// server/repositories/dskp.ts
export function listDskpRows(db: AppDatabase, query: { page: number; pageSize: number; search?: string; subjek?: string; tahun?: number }): PaginatedResponse<ReferensiRPH>;
export function getDskpMetadata(db: AppDatabase): { subjects: string[]; years: number[] };
export function getBidangOptions(db: AppDatabase, subjek: string, tahun: number): string[];
export function getSkOptions(db: AppDatabase, subjek: string, tahun: number, bidang?: string | null): string[];
export function getDskpDetail(db: AppDatabase, input: { subjek: string; tahun: number; bidang?: string | null; sk: string }): Pick<ReferensiRPH, 'sp' | 'spi'> | null;
export function createDskpRow(db: AppDatabase, input: Omit<ReferensiRPH, 'id' | 'created_at' | 'updated_at'>): ReferensiRPH;
export function updateDskpRow(db: AppDatabase, id: string, input: Partial<Omit<ReferensiRPH, 'id'>>): ReferensiRPH | null;
export function deleteDskpRow(db: AppDatabase, id: string): boolean;
```

- [ ] **Step 5: Add seed script**

Create `server/db/seed-dskp.ts` with an exported `seedDskp(db)` function that inserts the three current rows from `supabase/04_dskp_seed.sql` as normal SQLite text JSON. Add script:

```json
{
  "seed:dskp": "tsx server/db/seed-dskp.ts"
}
```

- [ ] **Step 6: Verify**

Run:

```bash
pnpm test server/db/schema.test.ts
pnpm build
```

Expected: tests and build pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add package.json server/db server/repositories src/types/index.ts
git commit -m "feat: add sqlite app schema and repositories"
```

## Task 4: Better Auth, Profiles, And Session Guards

**Files:**
- Create: `server/auth.ts`
- Create: `server/routes/session.ts`
- Create: `server/routes/auth.ts`
- Create: `server/routes/auth.test.ts`
- Modify: `server/app.ts`
- Modify: `package.json`

- [ ] **Step 1: Write auth route tests**

Create `server/routes/auth.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('auth/profile routes', () => {
  it('returns 401 from /api/auth/me without a session', async () => {
    const app = createApp({ databasePath: ':memory:', staticDir: null });
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  });
});
```

Run:

```bash
pnpm test server/routes/auth.test.ts
```

Expected: FAIL because `/api/auth/me` is not implemented.

- [ ] **Step 2: Configure Better Auth**

Create `server/auth.ts`:

```ts
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
```

- [ ] **Step 3: Implement session guards**

Create `server/routes/session.ts`:

```ts
import type { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import type { AppDatabase } from '../db/connection';
import type { AuthInstance } from '../auth';
import { getProfile, upsertProfile } from '../repositories/profiles';
import { ApiError } from './errors';

export interface AuthedRequest extends Request {
  authUser?: { id: string; email: string; name: string };
  profile?: NonNullable<ReturnType<typeof getProfile>>;
}

export function requireSession(auth: AuthInstance, db: AppDatabase) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required.'));
    }

    const user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || session.user.email.split('@')[0],
    };

    req.authUser = user;
    req.profile = getProfile(db, user.id) ?? upsertProfile(db, user);
    return next();
  };
}

export function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (req.profile?.role !== 'admin') {
    return next(new ApiError(403, 'FORBIDDEN', 'Admin access required.'));
  }

  return next();
}
```

- [ ] **Step 4: Implement auth/profile app routes**

Create `server/routes/auth.ts`:

```ts
import { Router } from 'express';
import { z } from 'zod';
import type { AppDatabase } from '../db/connection';
import type { AuthInstance } from '../auth';
import { updateProfileName } from '../repositories/profiles';
import { ApiError } from './errors';
import { requireSession, type AuthedRequest } from './session';

export function createAuthRoutes(auth: AuthInstance, db: AppDatabase) {
  const router = Router();
  const session = requireSession(auth, db);

  router.get('/auth/me', session, (req: AuthedRequest, res) => {
    res.json({ user: req.authUser, profile: req.profile, role: req.profile?.role });
  });

  router.patch('/profile', session, (req: AuthedRequest, res, next) => {
    const parsed = z.object({ name: z.string().trim().min(1).max(120) }).safeParse(req.body);
    if (!parsed.success || !req.authUser) {
      return next(new ApiError(400, 'BAD_REQUEST', 'Valid name is required.'));
    }

    const profile = updateProfileName(db, req.authUser.id, parsed.data.name);
    return res.json({ profile });
  });

  return router;
}
```

- [ ] **Step 5: Mount Better Auth and app auth routes**

In `server/app.ts`, create DB/auth instances before middleware routes:

```ts
const db = openDatabase(options.databasePath ?? ':memory:');
migrateAppSchema(db);
const auth = createAuth(options.databasePath ?? ':memory:');

app.use(cors({ origin: true, credentials: true }));
app.all('/api/auth/{*any}', toNodeHandler(auth));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', createAuthRoutes(auth, db));
```

Imports needed:

```ts
import { toNodeHandler } from 'better-auth/node';
import { createAuth } from './auth';
import { openDatabase } from './db/connection';
import { migrateAppSchema } from './db/schema';
import { createAuthRoutes } from './routes/auth';
```

- [ ] **Step 6: Add admin seed script**

Add script:

```json
{
  "seed:admin": "tsx server/db/seed-admin.ts"
}
```

Create `server/db/seed-admin.ts` to parse `--email`, open `DATABASE_PATH`, run `migrateAppSchema`, call `setAdminRole`, and print the updated profile.

- [ ] **Step 7: Verify**

Run:

```bash
pnpm test server/routes/auth.test.ts
pnpm build
```

Expected: tests and build pass.

- [ ] **Step 8: Commit**

Run:

```bash
git add package.json server
git commit -m "feat: add better auth session routes"
```

## Task 5: Protected RPH API Routes

**Files:**
- Create: `server/validation/schemas.ts`
- Create: `server/routes/rph-records.ts`
- Create: `server/routes/rph-records.test.ts`
- Modify: `server/app.ts`

- [ ] **Step 1: Write authorization tests**

Create `server/routes/rph-records.test.ts` with test-session injection using a test-only app option. Cover:

```ts
it('returns 401 for unauthenticated RPH list requests');
it('lists only records owned by the session user');
it('returns 404 when updating another user record');
it('returns 404 when deleting another user record');
it('creates records with the session user id and submitted tahun');
```

Each test should assert the API error shape `{ error: { code, message } }` and that clients never send a trusted `user_id`.

- [ ] **Step 2: Add validation schemas**

Create `server/validation/schemas.ts`:

```ts
import { z } from 'zod';

export const spiSchema = z.object({
  tp: z.number().int().min(1).max(6),
  desc: z.string().trim().min(1),
});

export const rphContentSchema = z.object({
  bidang: z.string().optional(),
  tajukStandardKandungan: z.string().optional(),
  objektif: z.string().optional(),
  aktiviti: z.string().optional(),
  refleksi: z.string().optional(),
  sp: z.array(z.string()).default([]),
  spi: z.array(spiSchema).default([]),
});

export const rphRecordSchema = z.object({
  tarikh: z.string().trim().min(1),
  hari: z.string().trim().min(1),
  tahun: z.number().int().min(1).max(6),
  kelas: z.string().trim().min(1),
  masa: z.string().trim().min(1),
  subjek: z.string().trim().min(1),
  content: rphContentSchema,
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});
```

- [ ] **Step 3: Implement RPH routes**

Create `server/routes/rph-records.ts`:

```ts
import { Router } from 'express';
import type { AppDatabase } from '../db/connection';
import type { AuthInstance } from '../auth';
import { createRphRecord, deleteRphRecord, listRphRecords, updateRphRecord } from '../repositories/rph-records';
import { ApiError } from './errors';
import { requireSession, type AuthedRequest } from './session';
import { paginationSchema, rphRecordSchema } from '../validation/schemas';

export function createRphRoutes(auth: AuthInstance, db: AppDatabase) {
  const router = Router();
  const session = requireSession(auth, db);

  router.get('/rph-records', session, (req: AuthedRequest, res) => {
    const query = paginationSchema.parse(req.query);
    res.json(listRphRecords(db, req.authUser!.id, query));
  });

  router.post('/rph-records', session, (req: AuthedRequest, res, next) => {
    const parsed = rphRecordSchema.safeParse(req.body);
    if (!parsed.success) return next(new ApiError(400, 'BAD_REQUEST', 'Invalid RPH record payload.'));
    res.status(201).json({ data: createRphRecord(db, req.authUser!.id, parsed.data) });
  });

  router.patch('/rph-records/:id', session, (req: AuthedRequest, res, next) => {
    const parsed = rphRecordSchema.partial().safeParse(req.body);
    if (!parsed.success) return next(new ApiError(400, 'BAD_REQUEST', 'Invalid RPH record payload.'));
    const record = updateRphRecord(db, req.authUser!.id, req.params.id, parsed.data);
    if (!record) return next(new ApiError(404, 'NOT_FOUND', 'RPH record not found.'));
    res.json({ data: record });
  });

  router.delete('/rph-records/:id', session, (req: AuthedRequest, res, next) => {
    if (!deleteRphRecord(db, req.authUser!.id, req.params.id)) {
      return next(new ApiError(404, 'NOT_FOUND', 'RPH record not found.'));
    }
    return res.status(204).send();
  });

  return router;
}
```

- [ ] **Step 4: Mount routes and verify**

Mount in `server/app.ts`:

```ts
app.use('/api', createRphRoutes(auth, db));
```

Run:

```bash
pnpm test server/routes/rph-records.test.ts
pnpm build
```

- [ ] **Step 5: Commit**

Run:

```bash
git add server
git commit -m "feat: add protected rph api"
```

## Task 6: Protected DSKP API Routes

**Files:**
- Create: `server/routes/dskp.ts`
- Create: `server/routes/dskp.test.ts`
- Modify: `server/app.ts`
- Modify: `server/validation/schemas.ts`

- [ ] **Step 1: Write DSKP tests**

Create `server/routes/dskp.test.ts` covering:

```ts
it('returns 401 for unauthenticated DSKP metadata requests');
it('allows teachers to read metadata, bidang, sk, detail, and paginated rows');
it('returns sp and spi from /api/dskp/detail');
it('returns 403 when a teacher creates, updates, or deletes DSKP rows');
it('allows admins to create complete DSKP rows');
it('returns 400 for invalid sp or spi payloads');
```

- [ ] **Step 2: Add DSKP schema**

Append to `server/validation/schemas.ts`:

```ts
export const dskpRowSchema = z.object({
  subjek: z.string().trim().min(1),
  tahun: z.number().int().min(1).max(6),
  bidang: z.string().trim().nullable().optional(),
  sk: z.string().trim().min(1),
  sp: z.array(z.string().trim().min(1)).default([]),
  spi: z.array(spiSchema).default([]),
});
```

- [ ] **Step 3: Implement DSKP routes**

Create `server/routes/dskp.ts` using `requireSession` for all routes and `requireAdmin` for writes. Route paths:

```ts
GET /api/dskp/metadata
GET /api/dskp/bidang?subjek=&tahun=
GET /api/dskp/sk?subjek=&tahun=&bidang=
GET /api/dskp/detail?subjek=&tahun=&bidang=&sk=
GET /api/dskp?page=&pageSize=&search=&subjek=&tahun=
POST /api/dskp
PATCH /api/dskp/:id
DELETE /api/dskp/:id
```

For invalid query parameters return `400 BAD_REQUEST`; for missing detail rows return `{ sp: [], spi: [] }`.

- [ ] **Step 4: Mount routes and verify**

Mount in `server/app.ts`:

```ts
app.use('/api', createDskpRoutes(auth, db));
```

Run:

```bash
pnpm test server/routes/dskp.test.ts
pnpm build
```

- [ ] **Step 5: Commit**

Run:

```bash
git add server
git commit -m "feat: add protected dskp api"
```

## Task 7: Frontend API Client And Auth Migration

**Files:**
- Create: `src/lib/apiClient.ts`
- Create: `src/lib/authClient.ts`
- Modify: `src/context/AuthContext.ts`
- Modify: `src/components/AuthContext.tsx`
- Modify: `src/components/LoginPage.tsx`
- Modify: `src/components/Settings.tsx`
- Modify: `src/App.tsx`
- Create: `src/components/LoginPage.test.tsx`
- Create: `src/components/Settings.test.tsx`

- [ ] **Step 1: Write frontend auth tests**

Test that:

```ts
it('LoginPage calls authClient.signIn.email for login');
it('LoginPage calls authClient.signUp.email for signup');
it('Settings patches /api/profile for name changes');
it('Settings calls authClient.changePassword for password changes');
```

Mock `src/lib/authClient.ts` and `global.fetch`.

- [ ] **Step 2: Implement API client**

Create `src/lib/apiClient.ts`:

```ts
import type { ApiErrorResponse } from '../types';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    const error = body?.error;
    throw new ApiClientError(response.status, error?.code ?? 'INTERNAL', error?.message ?? 'Request failed.');
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
```

Create `src/lib/authClient.ts`:

```ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: window.location.origin,
});
```

- [ ] **Step 3: Replace auth context types**

Update `src/context/AuthContext.ts`:

```ts
import { createContext } from 'react';
import type { AppUser, Profile, UserRole } from '../types';

export interface AuthContextType {
  user: AppUser | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

- [ ] **Step 4: Replace `AuthProvider` implementation**

`src/components/AuthContext.tsx` should call `apiRequest<{ user: AppUser; profile: Profile; role: UserRole }>('/api/auth/me')` on mount, treat `401` as logged out, expose `refresh`, and call `authClient.signOut()` before clearing state.

- [ ] **Step 5: Migrate login and settings**

`LoginPage` should use:

```ts
await authClient.signIn.email({ email, password });
await authClient.signUp.email({ email, password, name: email.split('@')[0] });
```

`Settings` should use:

```ts
await apiRequest<{ profile: Profile }>('/api/profile', {
  method: 'PATCH',
  body: JSON.stringify({ name: username.trim() }),
});

await authClient.changePassword({
  currentPassword,
  newPassword,
  revokeOtherSessions: true,
});
```

- [ ] **Step 6: Remove Supabase credential gates**

In `App.tsx`, remove `hasCredentials`, `connectionStatus`, and `connectionError` branches. Loading only depends on `authLoading`; logged out state renders `LoginPage`.

- [ ] **Step 7: Verify**

Run:

```bash
pnpm test src/components/LoginPage.test.tsx src/components/Settings.test.tsx
pnpm build
```

- [ ] **Step 8: Commit**

Run:

```bash
git add src package.json pnpm-lock.yaml
git commit -m "feat: migrate frontend auth to better auth"
```

## Task 8: Frontend RPH And DSKP API Migration

**Files:**
- Create: `src/lib/rphApi.ts`
- Create: `src/lib/dskpApi.ts`
- Modify: `src/hooks/useRecords.ts`
- Modify: `src/components/RPHForm.tsx`
- Modify: `src/components/DSKPManager.tsx`
- Modify: `src/App.tsx`
- Create: `src/hooks/useRecords.test.tsx`
- Create: `src/components/RPHForm.test.tsx`
- Create: `src/components/DSKPManager.test.tsx`

- [ ] **Step 1: Write frontend workflow tests**

Cover:

```ts
it('useRecords exposes fetch errors');
it('useRecords deleteRecord throws API errors');
it('RPHForm initializes selected year from initialData.tahun');
it('RPHForm submits tahun with new records');
it('DSKPManager renders write controls for admins');
it('DSKPManager hides write controls for teachers and shows 403 errors');
```

- [ ] **Step 2: Implement RPH API wrapper**

Create `src/lib/rphApi.ts`:

```ts
import type { PaginatedResponse, RPHRecord } from '../types';
import { apiRequest } from './apiClient';

export function listRphRecords(params: { page: number; pageSize: number; search?: string }) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    ...(params.search ? { search: params.search } : {}),
  });
  return apiRequest<PaginatedResponse<RPHRecord>>(`/api/rph-records?${query}`);
}

export function createRphRecord(record: Omit<RPHRecord, 'id' | 'user_id'>) {
  return apiRequest<{ data: RPHRecord }>('/api/rph-records', { method: 'POST', body: JSON.stringify(record) });
}

export function updateRphRecord(id: string, record: Partial<RPHRecord>) {
  return apiRequest<{ data: RPHRecord }>(`/api/rph-records/${id}`, { method: 'PATCH', body: JSON.stringify(record) });
}

export function deleteRphRecord(id: string) {
  return apiRequest<void>(`/api/rph-records/${id}`, { method: 'DELETE' });
}
```

- [ ] **Step 3: Update `useRecords`**

Remove Supabase import. Add `error` state. `deleteRecord` must throw on API failure and refresh only after success.

- [ ] **Step 4: Persist `tahun` in `RPHForm`**

Add helper:

```ts
const parseYearFromKelas = (kelas: string) => {
  const match = kelas.match(/^([1-6])\b/);
  return match ? Number(match[1]) : '';
};
```

Initialize:

```ts
const [selectedYear, setSelectedYear] = useState<number | ''>(initialData?.tahun ?? parseYearFromKelas(initialData?.kelas ?? ''));
```

Submit:

```ts
tahun: Number(selectedYear),
```

PDF temp record must include `tahun: Number(selectedYear)`.

- [ ] **Step 5: Implement DSKP API wrapper**

Create `src/lib/dskpApi.ts` with functions for the exact DSKP API surface in the spec: `getDskpMetadata`, `getBidangOptions`, `getSkOptions`, `getDskpDetail`, `listDskpRows`, `createDskpRow`, `updateDskpRow`, `deleteDskpRow`.

- [ ] **Step 6: Update `DSKPManager`**

Remove Supabase import. Load rows from `listDskpRows`. Submit full rows with `subjek`, `tahun`, `bidang`, `sk`, `sp`, and `spi`. Use `role === 'admin'` from `useAuth()` for write controls. If an API write returns `403`, show `Admin access required.` near the form/list controls.

- [ ] **Step 7: Verify**

Run:

```bash
pnpm test src/hooks/useRecords.test.tsx src/components/RPHForm.test.tsx src/components/DSKPManager.test.tsx
pnpm build
```

- [ ] **Step 8: Commit**

Run:

```bash
git add src
git commit -m "feat: migrate records and dskp to api"
```

## Task 9: Remove Supabase Runtime And Update Documentation

**Files:**
- Delete: `src/lib/supabaseClient.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `README.md`
- Modify: `src/**/*.ts`
- Modify: `src/**/*.tsx`

- [ ] **Step 1: Assert no Supabase imports remain**

Run:

```bash
rg "supabase|@supabase" src package.json
```

Expected before deletion: only `src/lib/supabaseClient.ts` and `package.json`.

- [ ] **Step 2: Remove dependency and file**

Run:

```bash
pnpm remove @supabase/supabase-js
rm src/lib/supabaseClient.ts
```

- [ ] **Step 3: Update README**

Document:

```markdown
## Local Development

1. Copy `.env.example` to `.env`.
2. Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3005`, and `DATABASE_PATH=./data/erph.sqlite`.
3. Run `pnpm install`.
4. Run the verified Better Auth migration command from `docs/superpowers/specs/2026-06-18-better-auth-verification.md`.
5. Run `pnpm seed:dskp`.
6. Run `pnpm dev`.

## Admin Setup

After creating a user account, run:

```bash
pnpm seed:admin -- --email admin@example.com
```
```

- [ ] **Step 4: Verify**

Run:

```bash
rg "supabase|@supabase" src package.json
pnpm test
pnpm lint
pnpm build
```

Expected: `rg` finds no runtime Supabase references; tests, lint, and build pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add package.json pnpm-lock.yaml README.md src
git add -u
git commit -m "chore: remove supabase runtime"
```

## Task 10: End-To-End Manual Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-06-18-better-auth-verification.md` if commands changed.
- Modify: `README.md` if setup docs are inaccurate.

- [ ] **Step 1: Run full verification**

Run:

```bash
pnpm test
pnpm lint
pnpm build
```

- [ ] **Step 2: Start local app**

Run:

```bash
pnpm dev
```

Expected: Vite frontend and Express backend start. Better Auth endpoints are reachable under `/api/auth/*`.

- [ ] **Step 3: Manual workflow**

In the browser:

1. Sign up a teacher account.
2. Create an RPH record with a selected `tahun`.
3. Edit that record and confirm `tahun` is already selected.
4. Export the record PDF.
5. Visit DSKP as teacher and confirm write controls are hidden.
6. Promote the account with `pnpm seed:admin -- --email <email>`.
7. Sign out and sign back in.
8. Add a DSKP row with `subjek`, `tahun`, `bidang`, `sk`, `sp`, and `spi`.
9. Confirm the RPH wizard can retrieve the new row through the DSKP selection flow.

- [ ] **Step 4: Commit docs correction if needed**

Run:

```bash
git add README.md docs/superpowers/specs/2026-06-18-better-auth-verification.md
git commit -m "docs: finalize sqlite auth migration notes"
```

Only commit if Step 3 found documentation corrections.

## Self-Review

- Spec coverage: backend dependencies, Express, Better Auth, SQLite, profile roles, RPH ownership, admin-only DSKP writes, full DSKP data, `tahun` persistence, frontend error handling, tests, and documentation are covered by Tasks 1-10.
- Known execution constraint: the current checkout is on `master` with existing uncommitted changes. Execution must first use `superpowers:using-git-worktrees` or get explicit consent to work in place on `master`.
- Subagent constraint in this Codex environment: subagent tools are present, but tool policy requires explicit user authorization before spawning subagents. If the user does not explicitly authorize subagents, use inline execution with `superpowers:executing-plans`.
- External docs checked: Better Auth Express integration, SQLite adapter, installation, and email/password pages on 2026-06-18.
