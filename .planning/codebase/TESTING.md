# Testing Patterns

**Analysis Date:** 2025-05-22

## Test Framework

**Runner:**
- Not detected. No testing framework (e.g., Vitest, Jest) is currently installed or configured.

**Assertion Library:**
- Not detected.

**Run Commands:**
```bash
# No testing scripts found in package.json
```

## Test File Organization

**Location:**
- Not applicable (no tests).

**Naming:**
- No established pattern.

**Structure:**
- No established pattern.

## Test Structure

**Suite Organization:**
- Not applicable.

**Patterns:**
- No established pattern.

## Mocking

**Framework:** Not detected.

**Patterns:**
- No established pattern.

**What to Mock:**
- [Recommended] Supabase Client: `src/lib/supabaseClient.ts`
- [Recommended] Local Storage: Used in `src/components/AuthContext.tsx`
- [Recommended] External Libraries: `framer-motion`, `lucide-react`, `html2pdf.js`

## Fixtures and Factories

**Test Data:**
- Manual test scripts in `scripts/` directory use hardcoded data (e.g., `scripts/check_test_subject.js`).

**Location:**
- Not applicable.

## Coverage

**Requirements:** None enforced.

**Current Coverage:** 0% (no tests detected).

## Test Types

**Unit Tests:**
- Recommended for hooks (`src/hooks/useRecords.ts`) and logic helpers (`getMalayDay`).

**Integration Tests:**
- Recommended for components interacting with Supabase (`src/components/RPHForm.tsx`, `src/components/RPHRecords.tsx`).

**E2E Tests:**
- Recommended for the whole RPH flow (Login -> Form -> Record -> Print).

## Common Patterns

**Async Testing:**
- Recommended for Supabase interactions.

**Error Testing:**
- Recommended for API failures and environment variable configuration errors.

## Manual Verification Scripts

The codebase contains a `scripts/` directory with utility scripts that appear to be used for manual verification of the database state:
- `scripts/check_limit.js`: Checks rows in `referensi_rph`.
- `scripts/check_tahun6.js`: Checks specific data for Year 6.
- `scripts/check_test_subject.js`: Verifies specific subject entries.
- `scripts/inspect_schema.js`: Likely used to verify table structures.

These scripts use `dotenv` to load credentials from `.env` and `supabase-js` to query the database.

---

*Testing analysis: 2025-05-22*
