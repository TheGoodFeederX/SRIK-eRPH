# External Integrations

**Analysis Date:** 2025-02-13

## APIs & External Services

**Backend Service:**
- Supabase - Used for authentication, database, and backend logic.
  - SDK/Client: `@supabase/supabase-js`
  - Auth: `VITE_SUPABASE_ANON_KEY` (client-side key)

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: `VITE_SUPABASE_URL`
  - Client: `@supabase/supabase-js`
  - Local configuration: `supabase/` contains schema definitions and security policies.

**File Storage:**
- Not explicitly configured in the client, but Supabase Storage is potentially used if files are uploaded.

**Caching:**
- None detected.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: Email/Password login/signup in `src/components/LoginPage.tsx`.
  - Session handling: `src/components/AuthContext.tsx`.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- Console logging in `src/components/AuthContext.tsx` and `src/components/LoginPage.tsx`.

## CI/CD & Deployment

**Hosting:**
- Vite output suggests static hosting. `vite.config.ts` mentions `erph.zulnajmi.my`.

**CI Pipeline:**
- None detected in repository.

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Supabase project anonymous key.

**Secrets location:**
- Not committed. Expected in local `.env` file.

## Webhooks & Callbacks

**Incoming:**
- None detected.

**Outgoing:**
- None detected.

---

*Integration audit: 2025-02-13*
