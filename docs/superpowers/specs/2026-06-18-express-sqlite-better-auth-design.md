# Express SQLite Better Auth Migration Design

## Summary

The app will move from a Supabase-backed browser client to a React/Vite frontend served alongside an Express API backed by SQLite. Authentication and cookie sessions will be handled by better-auth. All database access will move behind server routes so authorization can be enforced centrally.

The current user-facing workflows stay intact: teachers sign in, create and edit RPH records, export PDFs, manage account settings, and browse DSKP reference data. DSKP mutations become admin-only and are enforced by backend checks, not by UI visibility alone.

## Goals

- Replace Supabase Auth, RLS, RPCs, and direct browser database calls with Express API endpoints.
- Use better-auth for email/password auth and HTTP-only cookie sessions.
- Store application data in SQLite.
- Preserve per-user ownership for RPH records.
- Restrict DSKP create/update/delete to admin users.
- Expand DSKP management so rows contain the full data needed by the RPH wizard: `subjek`, `tahun`, `bidang`, `sk`, `sp`, and `spi`.
- Fix edit mode by storing or deriving `tahun` reliably instead of depending only on the class label.
- Surface fetch and mutation errors to users.
- Add automated tests for backend authorization and frontend workflow regressions.

## Non-Goals

- No full framework migration to Next.js, Remix, or another stack.
- No online/offline sync between devices beyond the central Express server.
- No role management UI in the first implementation; initial admins can be seeded or updated through a script.
- No broad UI redesign beyond changes required by the backend migration and DSKP form completeness.

## Architecture

The repository will contain one Node application with two runtime surfaces:

- `src/`: existing React/Vite frontend.
- `server/`: new Express API, better-auth configuration, SQLite connection, migrations, repositories, and route handlers.

During development, Vite serves the frontend and proxies `/api` and better-auth routes to Express. In production, Express can serve the built frontend from `dist` and handle API/auth routes in the same process.

Frontend code will not import database or auth provider SDKs. It will use a local API client that sends requests with `credentials: 'include'`, receives JSON responses, and maps failures into typed errors.

## Authentication And Sessions

better-auth will own email/password authentication and session cookies. The backend will expose the better-auth handler on its configured auth route and provide a small app-specific `/api/auth/me` endpoint that returns the current user profile and role in the shape the React app needs.

The implementation must verify the current better-auth Express and SQLite integration APIs before coding. If better-auth supplies its own SQLite adapter/migrations, those will be used. If it requires an adapter package, that package will be added explicitly and pinned in `package.json` and `pnpm-lock.yaml`.

Session cookies must be HTTP-only. Frontend auth state is derived from the server rather than local storage or user-editable metadata.

## Authorization Model

Every authenticated user has a profile with:

- `id`: auth user id.
- `email`.
- `name`.
- `role`: `teacher` or `admin`.
- timestamps.

RPH records are user-owned. API handlers always constrain reads, updates, and deletes to the session user id. Clients never send a trusted `user_id`.

DSKP reads are available to authenticated users. DSKP writes require `role = 'admin'`. The DSKP tab may still be visible or hidden based on role, but the route-level check is authoritative.

## SQLite Data Model

Application tables:

```sql
create table profiles (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null check (role in ('teacher', 'admin')) default 'teacher',
  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);

create table rph_records (
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

create table referensi_rph (
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

create index idx_rph_user_date on rph_records(user_id, tarikh desc);
create index idx_referensi_lookup on referensi_rph(subjek, tahun, bidang, sk);
create index idx_referensi_subjek on referensi_rph(subjek);
create index idx_referensi_tahun on referensi_rph(tahun);
```

`content`, `sp`, and `spi` are JSON-encoded text in SQLite and are parsed at API boundaries. The API validates these fields before writing so malformed JSON does not reach the database.

better-auth may create additional auth tables. Those are separate from app-specific tables unless the verified better-auth integration recommends a shared users table shape.

## API Surface

Auth/profile:

- `GET /api/auth/me`: current session user, profile, and role.
- `PATCH /api/profile`: update display name.
- Password changes use the verified better-auth password-update endpoint or client helper selected in the dependency-verification task.
- Sign in, sign up, and sign out use better-auth's official client/server endpoints.

RPH records:

- `GET /api/rph-records?page=&pageSize=&search=` returns paginated records for the current user.
- `POST /api/rph-records` creates a record for the current user.
- `PATCH /api/rph-records/:id` updates a record owned by the current user.
- `DELETE /api/rph-records/:id` deletes a record owned by the current user.

DSKP:

- `GET /api/dskp/metadata` returns unique subjects and years.
- `GET /api/dskp/bidang?subjek=&tahun=` returns matching `bidang` values.
- `GET /api/dskp/sk?subjek=&tahun=&bidang=` returns matching SK values.
- `GET /api/dskp/detail?subjek=&tahun=&bidang=&sk=` returns `sp` and `spi`.
- `GET /api/dskp` returns paginated/filterable rows for the DSKP manager.
- `POST /api/dskp` creates a complete DSKP row. Admin only.
- `PATCH /api/dskp/:id` updates a complete DSKP row. Admin only.
- `DELETE /api/dskp/:id` deletes a DSKP row. Admin only.

All routes return a consistent error shape:

```json
{ "error": { "code": "FORBIDDEN", "message": "Admin access required." } }
```

## Frontend Changes

`src/lib/supabaseClient.ts` will be replaced by a local API module or removed after all imports are migrated.

`useAuth` will call `/api/auth/me`, expose `user`, `profile`, `role`, `loading`, `error`, `signOut`, and helpers for login/signup if better-auth's official client API is not used directly.

`LoginPage` and `Settings` will switch from Supabase auth calls to better-auth-backed flows. The UI should keep the same basic layout.

`useRecords` will call the RPH API and expose error state. `deleteRecord` must throw or report failure instead of silently ignoring backend errors.

`RPHForm` will include `tahun` in form state and submitted records. Edit mode initializes `tahun` from the record. Existing records without `tahun` can use a fallback parser from `kelas`, but new records persist `tahun` explicitly.

`DSKPManager` will edit full DSKP records, including `bidang`, `sp`, and `spi`. `sp` is edited as a list of strings. `spi` is edited as a list of `{ tp, desc }` rows. The manager will show write controls only for admins and will still handle `403` responses cleanly.

## Migration And Seed Data

The existing Supabase SQL files become historical reference and should not be used by runtime code. New SQLite migrations live under `server/db/migrations`.

Seed data should be derived from `supabase/04_dskp_seed.sql` into SQLite-compatible inserts or a JSON seed file consumed by a script. The seed path must preserve `bidang`, `sk`, `sp`, and `spi`.

The first admin can be created by an explicit script, for example `pnpm seed:admin -- --email admin@example.com`, after the better-auth user exists. The script updates the app `profiles` role.

## Error Handling

Backend handlers validate request bodies and query parameters before database writes. They return `400` for invalid input, `401` for missing sessions, `403` for insufficient role, `404` for missing owned records, and `500` for unexpected failures.

Frontend hooks keep loading and error states separate. Screens show user-readable errors near the affected controls. Mutations refresh local lists only after a successful response.

## Testing

Backend tests cover:

- unauthenticated API requests return `401`;
- teachers cannot create, update, or delete DSKP rows;
- admins can create complete DSKP rows;
- RPH list/update/delete are scoped to the authenticated owner;
- invalid DSKP JSON/list payloads return `400`;
- `/api/dskp/detail` returns `sp` and `spi` for the form wizard.

Frontend tests cover:

- edit mode initializes `tahun` and allows progression without reselecting it;
- DSKP Manager renders write controls for admins and read-only state for teachers;
- `useRecords` exposes fetch and delete errors;
- RPH form submits `tahun` with new records;
- login/settings flows call the new auth layer.

Build verification includes:

- backend test suite;
- frontend test suite;
- TypeScript build;
- ESLint.

## Rollout Sequence

1. Add backend dependencies and verify better-auth integration.
2. Add SQLite database module, migrations, and seed/admin scripts.
3. Add better-auth configuration and Express server.
4. Add protected app API routes with tests.
5. Add frontend API client and migrate auth.
6. Migrate records and DSKP flows.
7. Remove Supabase runtime dependency and update documentation.

The implementation will be done with test-first tasks. Production code changes should follow failing tests for each behavior.

## Dependency Verification Requirement

The first implementation task must verify the exact better-auth Express and SQLite adapter APIs from the installed package and official docs before any auth code is written. The design requires better-auth, and the implementation plan must use the verified function names and route paths from that task.
