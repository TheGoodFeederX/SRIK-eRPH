# Codebase Concerns

**Analysis Date:** 2025-02-14

## Tech Debt

**Giant Component (DSKPManager):**
- Issue: `DSKPManager.tsx` is over 1000 lines and violates the Single Responsibility Principle. It handles data fetching, pagination, multi-field filtering, CRUD operations, and UI notifications (toasts).
- Files: `src/components/DSKPManager.tsx`
- Impact: Difficult to test, maintain, and refactor. Changes to one part of the logic risk breaking others.
- Fix approach: Split into smaller components (e.g., `DSKPFilter`, `DSKPTable`, `DSKPModals`) and extract data fetching logic into a custom hook.

**Repetitive Data Mapping:**
- Issue: Manual snake_case to camelCase mapping is performed in multiple places, especially in hooks and components when interacting with Supabase.
- Files: `src/hooks/useRecords.ts`, `src/components/DSKPManager.tsx`
- Impact: Increased boilerplate, higher risk of field name mismatches, and maintenance overhead when schema changes.
- Fix approach: Use a utility function or a layer (like an adapter) to handle name mapping, or standardize on one convention if possible.

**Fragile PDF Generation:**
- Issue: PDF generation is implemented twice using different libraries (`html2pdf.js` in `RPHForm.tsx` and `jspdf`/`html2canvas` in `RPHRecords.tsx`) with `@ts-ignore` comments.
- Files: `src/components/RPHForm.tsx`, `src/components/RPHRecords.tsx`
- Impact: Type safety issues, inconsistent output between the two implementations, and high complexity (e.g., manual iframe creation and style copying).
- Fix approach: Consolidate PDF generation into a single utility or service. Resolve TypeScript definitions for the libraries.

**Hardcoded Business Logic:**
- Issue: Year-to-Class mapping is hardcoded in the frontend.
- Files: `src/components/RPHForm.tsx`
- Impact: Requires a code deployment to update class names or school structure.
- Fix approach: Move this configuration to a database table or a dedicated configuration file.

## Security Considerations

**Permissive DSKP Policies:**
- Issue: The Row Level Security (RLS) policies for `referensi_rph` allow *any* authenticated user to insert, update, or delete reference data.
- Files: `supabase/02_security_policies.sql`
- Current mitigation: None beyond requiring authentication.
- Recommendations: Restrict write access to admin users only (e.g., by checking a `role` field in the user's profile or JWT).

## Performance Bottlenecks

**Unoptimized DSKP Fetching:**
- Issue: `DSKPManager.tsx` fetches all records (potentially 20k+) in a loop on the client side during initialization.
- Files: `src/components/DSKPManager.tsx`
- Cause: Client-side pagination and filtering instead of server-side.
- Improvement path: Implement server-side pagination and filtering using Supabase's built-in capabilities (e.g., `.range()`, `.ilike()`).

**Inefficient State Updates:**
- Issue: `useRecords.ts` re-fetches the entire list of RPH records after every create, update, or delete operation.
- Files: `src/hooks/useRecords.ts`
- Cause: Lack of optimistic updates or local state management for mutations.
- Improvement path: Implement optimistic updates or manually update the local `records` state instead of re-fetching everything.

## Fragile Areas

**PDF Generation via Iframes:**
- Files: `src/components/RPHRecords.tsx`
- Why fragile: Relies on capturing styles from the main document and injecting them into a hidden iframe. This is prone to breaking with CSS changes or browser updates.
- Safe modification: Use a more robust PDF generation strategy, possibly server-side or using a library that doesn't require DOM manipulation.

## Test Coverage Gaps

**Complete Lack of Automated Tests:**
- What's not tested: Entire application logic (auth, CRUD, filtering, PDF generation).
- Files: All files in `src/`
- Risk: Regressions are highly likely during refactoring. Critical business logic (e.g., RPH record management) could break unnoticed.
- Priority: High

---

*Concerns audit: 2025-02-14*
