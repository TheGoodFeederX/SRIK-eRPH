# Architecture

**Analysis Date:** 2025-02-14

## Pattern Overview

**Overall:** Client-Server architecture utilizing a React Single Page Application (SPA) powered by Vite, with Supabase as a Backend-as-a-Service (BaaS).

**Key Characteristics:**
- **Serverless Backend:** Leverages Supabase for authentication, database (PostgreSQL), and Row-Level Security (RLS).
- **Hook-based Data Management:** Encapsulates data fetching and mutations in custom React hooks to separate concerns from UI components.
- **Context-driven Authentication:** Uses React Context API to provide authentication state globally across the application.

## Layers

**UI Layer:**
- Purpose: Renders the user interface and handles user interactions.
- Location: `src/components/`
- Contains: React components for forms, lists, print layouts, and navigation.
- Depends on: Logic/State Layer (`AuthContext`, `useRecords`), Types (`src/types/index.ts`).
- Used by: `src/App.tsx`

**Logic/State Layer:**
- Purpose: Manages application state, business logic, and data orchestration.
- Location: `src/hooks/`, `src/components/AuthContext.tsx`
- Contains: Custom hooks for record management and authentication provider.
- Depends on: Data Access Layer (`src/lib/supabaseClient.ts`).
- Used by: UI Layer.

**Data Access Layer:**
- Purpose: Provides an interface to interact with the external Supabase API.
- Location: `src/lib/`
- Contains: Supabase client initialization and configuration.
- Depends on: Supabase SDK.
- Used by: Logic/State Layer.

**Persistence Layer:**
- Purpose: Stores data and enforces security rules.
- Location: `supabase/` (schema definitions and policies)
- Contains: SQL migrations for tables, indices, and RLS policies.
- Depends on: Supabase/PostgreSQL.
- Used by: Supabase API.

## Data Flow

**Authentication Flow:**

1. `src/components/AuthContext.tsx` initializes and checks for existing session via `supabase.auth.getSession()`.
2. `LoginPage.tsx` uses `supabase.auth.signInWithPassword()` to authenticate users.
3. `AuthContext.tsx` listens for auth state changes via `onAuthStateChange` and updates global `user` state.
4. Protected components in `src/App.tsx` render only when `user` is present.

**Record Management Flow (RPH):**

1. `src/App.tsx` consumes `useRecords` hook.
2. `useRecords.ts` fetches data from `rph_records` table via `supabaseClient`.
3. UI components (`RPHRecords.tsx`) display the data.
4. Mutation actions (add/update/delete) in `useRecords.ts` perform API calls and trigger re-fetches to sync local state.

**State Management:**
- Local component state: Managed via `useState` for UI-specific flags (e.g., active tab, editing record).
- Global state: Managed via `AuthContext` for user session.
- Server state: Synchronized via `useRecords` hook which wraps Supabase queries.

## Key Abstractions

**AuthContext:**
- Purpose: Provides centralized authentication state and methods (`user`, `signOut`, `connectionStatus`).
- Examples: `src/components/AuthContext.tsx`
- Pattern: React Context Provider.

**useRecords Hook:**
- Purpose: Abstracts CRUD operations for teaching records (RPH).
- Examples: `src/hooks/useRecords.ts`
- Pattern: Custom Hook (Facade pattern for data access).

**Supabase Client:**
- Purpose: Singleton instance for interacting with Supabase services.
- Examples: `src/lib/supabaseClient.ts`
- Pattern: Singleton/Factory.

## Entry Points

**Web Entry Point:**
- Location: `src/main.tsx`
- Triggers: Browser page load.
- Responsibilities: Mounts the React application and applies global styles.

**Application Shell:**
- Location: `src/App.tsx`
- Triggers: React component tree mounting.
- Responsibilities: Main layout, tab navigation, authentication gating, and routing logic.

## Error Handling

**Strategy:** Graceful degradation and user-facing notifications for connection/auth issues.

**Patterns:**
- **Credential Validation:** `src/lib/supabaseClient.ts` checks for environment variables and provides a placeholder client if missing.
- **Connection Testing:** `src/components/AuthContext.tsx` performs a health check on initialization to detect API connectivity issues.
- **UI Error States:** `src/App.tsx` renders dedicated error screens if credentials are missing or connection fails.

## Cross-Cutting Concerns

**Logging:** Basic `console.log` for debugging lifecycle and auth events in `App.tsx` and `AuthContext.tsx`.
**Validation:** Client-side validation in forms (`RPHForm.tsx`) and database-level constraints in PostgreSQL.
**Authentication:** Handled by Supabase Auth with Row-Level Security (RLS) policies defined in `supabase/02_security_policies.sql`.

---

*Architecture analysis: 2025-02-14*
