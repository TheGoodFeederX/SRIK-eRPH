# Codebase Structure

**Analysis Date:** 2025-02-14

## Directory Layout

```
erph/
├── public/             # Static assets (logos, icons)
├── scripts/            # Database utility scripts
├── src/                # Primary source code
│   ├── components/     # React components (UI & Context)
│   ├── hooks/          # Custom React hooks (Logic & State)
│   ├── lib/            # External library configurations (Supabase)
│   ├── types/          # TypeScript definitions
│   ├── App.tsx         # Root application component
│   └── main.tsx        # React entry point
├── supabase/           # Supabase SQL schema & migrations
└── package.json        # Dependencies & scripts
```

## Directory Purposes

**src/components/:**
- Purpose: Reusable and page-level UI components.
- Contains: TSX files for forms, lists, layouts, and auth context.
- Key files: `AuthContext.tsx`, `RPHForm.tsx`, `RPHRecords.tsx`.

**src/hooks/:**
- Purpose: Encapsulation of logic and server-state interactions.
- Contains: Custom hooks for record management.
- Key files: `useRecords.ts`.

**src/lib/:**
- Purpose: Infrastructure and third-party client initialization.
- Contains: Configuration for Supabase.
- Key files: `supabaseClient.ts`.

**src/types/:**
- Purpose: Centralized type definitions for the domain model.
- Contains: Interfaces for RPH records, DSKP data, and UI state.
- Key files: `index.ts`.

**supabase/:**
- Purpose: Backend schema and security configuration.
- Contains: SQL files for tables, RLS policies, and business logic.
- Key files: `01_initial_schema.sql`, `02_security_policies.sql`.

**scripts/:**
- Purpose: Developer utilities for data management and inspection.
- Contains: Node.js scripts for schema inspection and data cleanup.
- Key files: `inspect_schema.js`, `cleanup_dskp.js`.

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React DOM mounting.
- `src/App.tsx`: High-level application layout and routing.

**Configuration:**
- `vite.config.ts`: Build and dev server configuration.
- `tsconfig.json`: TypeScript compiler options.
- `.env` (not committed): Supabase credentials.

**Core Logic:**
- `src/hooks/useRecords.ts`: CRUD operations for teaching records.
- `src/components/AuthContext.tsx`: Authentication state management.

**Testing:**
- (Not explicitly detected in current structure - tests are missing or co-located).

## Naming Conventions

**Files:**
- **React Components:** PascalCase (`RPHForm.tsx`).
- **Hooks:** camelCase starting with `use` (`useRecords.ts`).
- **Libraries/Utilities:** camelCase (`supabaseClient.ts`).
- **Scripts:** snake_case (`check_limit.js`).

**Directories:**
- **Feature/Role based:** lowercase (`components`, `hooks`, `lib`).

## Where to Add New Code

**New Feature:**
- Primary code: Create a new component in `src/components/`.
- Logic: If complex state is involved, add a hook in `src/hooks/`.
- Types: Add interface to `src/types/index.ts`.

**New Component/Module:**
- Implementation: `src/components/NewComponent.tsx`.
- Styles: Use global `src/index.css` or inline styles as per current pattern.

**Utilities:**
- Shared helpers: Create `src/lib/utils.ts` or add to specific domain-related folders.

## Special Directories

**.planning/:**
- Purpose: GSD-related documentation and implementation plans.
- Generated: Yes (by GSD).
- Committed: Yes.

**public/:**
- Purpose: Static assets served at the root URL.
- Generated: No.
- Committed: Yes.

---

*Structure analysis: 2025-02-14*
