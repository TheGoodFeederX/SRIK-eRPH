# Coding Conventions

**Analysis Date:** 2025-05-22

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `src/components/RPHForm.tsx`, `src/components/AuthContext.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `src/hooks/useRecords.ts`)
- Utilities/Clients: camelCase (e.g., `src/lib/supabaseClient.ts`)
- Types: camelCase or `index.ts` (e.g., `src/types/index.ts`)
- Entry points: camelCase (e.g., `src/main.tsx`, `src/App.tsx`)

**Functions:**
- Component functions: PascalCase (e.g., `export const RPHForm: React.FC...`)
- Helper functions: camelCase (e.g., `getMalayDay`, `handleChange`)
- Hook functions: camelCase (e.g., `export const useRecords = () => { ... }`)

**Variables:**
- General: camelCase (e.g., `formData`, `subjects`, `editingRecord`)
- Constants (Global): UPPER_SNAKE_CASE (e.g., `HARI_OPTIONS`, `MASA_OPTIONS`, `KELAS_MAP`)
- State setters: `set` + PascalCase (e.g., `setRecords`, `setLoading`)

**Types:**
- Interfaces/Types: PascalCase (e.g., `RPHRecord`, `ReferensiRPH`, `Tab`)
- Props: Component name + `Props` (e.g., `RPHFormProps`)

## Code Style

**Formatting:**
- Vite + Prettier (implicit from standard Vite template, though `.prettierrc` is not present, standard ESLint rules apply)
- Indent: 2 spaces
- Semicolons: Used (observed in `App.tsx`, `useRecords.ts`)
- Quotes: Single quotes preferred for strings (observed in `useRecords.ts`, `App.tsx`)

**Linting:**
- Tool: ESLint 9+
- Configuration: `eslint.config.js`
- Rules:
  - `js.configs.recommended`
  - `tseslint.configs.recommended`
  - `reactHooks.configs.flat.recommended`
  - `reactRefresh.configs.vite`
- Strict TypeScript: `strict: true` in `tsconfig.app.json`

## Import Organization

**Order:**
1. React and React-related (e.g., `useState`, `useEffect`)
2. External libraries (e.g., `framer-motion`, `lucide-react`, `supabase`)
3. Project Hooks (e.g., `./hooks/useRecords`)
4. Project Components (e.g., `./components/RPHForm`)
5. Project Types (e.g., `./types`)
6. Styles/Assets (e.g., `./index.css`, `/logo.png`)

**Path Aliases:**
- Not detected. Relative paths are used (e.g., `../lib/supabaseClient`, `../types`).

## Error Handling

**Patterns:**
- Supabase calls: Basic error checking after API calls (e.g., `if (error) console.error(error)` or `if (!error && data)`)
- Global: `App.tsx` checks for missing environment variables or connection errors on mount.
- Connection: `AuthContext.tsx` handles Supabase connection testing and provides `connectionStatus` and `connectionError` states.

## Logging

**Framework:** `console` (native)

**Patterns:**
- Console logging is used for debugging (observed in `App.tsx`: `console.log('AppContent: Render', ...)`).
- Error logging via `console.error` (observed in `scripts/`).

## Comments

**When to Comment:**
- Minimal commenting observed. Comments are used to describe specific sections or workarounds (e.g., `// Time slot options for Masa field`, `// @ts-ignore`).

**JSDoc/TSDoc:**
- Not detected.

## Function Design

**Size:**
- Components vary in size. `src/components/RPHForm.tsx` is large (~500 lines) and contains both logic and complex UI.

**Parameters:**
- Components use a single `props` object (or destructured).
- Event handlers use standard React event types (e.g., `React.ChangeEvent<HTMLInputElement>`).

**Return Values:**
- Components return JSX elements.
- Hooks return objects with state and functions (e.g., `return { records, loading, addRecord, updateRecord, deleteRecord };`).

## Module Design

**Exports:**
- Named exports preferred for components and hooks (e.g., `export const RPHForm = ...`, `export const useRecords = ...`).
- `App.tsx` uses default export for the main `App` component.

**Barrel Files:**
- `src/types/index.ts` acts as a barrel file for all types.

---

*Convention analysis: 2025-05-22*
