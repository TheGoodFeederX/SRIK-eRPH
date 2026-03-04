---
phase: 02-ux-performance
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/hooks/useRecords.ts
  - src/components/RPHRecords.tsx
autonomous: true
requirements:
  - REQ-05
must_haves:
  truths:
    - "useRecords hook uses Supabase's .range() for pagination"
    - "useRecords hook supports server-side search via .ilike() or .textSearch()"
    - "RPHRecords displays total record count and current page"
    - "Search query is executed on the server, not locally"
  artifacts:
    - path: "src/hooks/useRecords.ts"
      provides: "Paged data fetching with search support"
    - path: "src/components/RPHRecords.tsx"
      provides: "Pagination controls and search input"
  key_links:
    - from: "src/components/RPHRecords.tsx"
      to: "src/hooks/useRecords.ts"
      via: "function calls with page and search parameters"
---

<objective>
Implement server-side pagination and search for RPH records to improve performance and scalability.
</objective>

<execution_context>
@/home/dietpi/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-2/RESEARCH.md
@src/hooks/useRecords.ts
@src/components/RPHRecords.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update useRecords for server-side pagination and search</name>
  <files>src/hooks/useRecords.ts</files>
  <action>
    - Update the `fetchRecords` function to accept `page`, `pageSize`, and `searchTerm`.
    - Use Supabase's `.range(from, to)` to fetch a specific page of records.
    - Implement server-side filtering using `.ilike('subjek', ...)` or `.or(...)` for multiple fields.
    - Return `records`, `totalCount`, and `loading` state.
    - Add a `totalCount` state to the hook.
  </action>
  <verify>
    <automated>grep -q ".range(" src/hooks/useRecords.ts && grep -q "count: 'exact'" src/hooks/useRecords.ts</automated>
  </verify>
  <done>useRecords hook supports paginated data and server-side search.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate pagination and search in RPHRecords</name>
  <files>src/components/RPHRecords.tsx</files>
  <action>
    - Add state for `currentPage` and `searchTerm` in `RPHRecords.tsx`.
    - Implement pagination controls (Next, Previous, Page numbers).
    - Update the search input to trigger a new fetch from `useRecords`.
    - Display the total number of records found.
    - Ensure the UI handles loading states gracefully.
  </action>
  <verify>
    <automated>grep -q "currentPage" src/components/RPHRecords.tsx && grep -q "totalCount" src/components/RPHRecords.tsx</automated>
  </verify>
  <done>RPHRecords component features server-side search and pagination controls.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Verify pagination and search functionality</name>
  <what-built>Server-side pagination and search for RPH records.</what-built>
  <how-to-verify>
    1. Open the "Senarai Rekod" tab.
    2. Verify that only a limited number of records are displayed (e.g., 10 per page).
    3. Use the pagination controls to navigate through pages and confirm correct data loading.
    4. Type a search term and verify that the results are filtered correctly via the database.
    5. Check the total record count display.
  </how-to-verify>
  <resume-signal>approved</resume-signal>
</task>

</tasks>

<verification>
- Records are fetched in ranges (pages) from Supabase.
- Search queries are executed on the server.
- UI correctly reflects the paginated data and total count.
</verification>

<success_criteria>
- The application handles a large number of RPH records without performance degradation.
- Users can easily search and navigate through their history.
</success_criteria>

<output>
After completion, create `.planning/phases/02-ux-performance/02-01-SUMMARY.md`
</output>
