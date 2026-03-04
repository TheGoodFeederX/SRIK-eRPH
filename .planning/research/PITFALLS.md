# Domain Pitfalls: eRPH

**Domain:** Educational Record Management (eRPH)
**Researched:** 2025-05-18

## Critical Pitfalls

### Pitfall 1: Client-side Search Overload
**What goes wrong:** `RPHRecords.tsx` currently fetches all records and filters them locally.
**Why it happens:** Simplest to implement initially.
**Consequences:** As a teacher adds 100+ records, the page load time increases exponentially, eventually crashing the browser or causing massive lag.
**Prevention:** Implement server-side search and pagination (infinite scroll or page numbers).
**Detection:** Slow page transitions to the "Records" tab and high browser memory usage.

### Pitfall 2: Loose DSKP Integrity
**What goes wrong:** Storing DSKP as plain text in the `rph_records` table without foreign key references.
**Why it happens:** Easy to set up without a complex relational schema.
**Consequences:** Impossible to perform analytics (e.g., "Which learning standards were missed this year?") because text matches are unreliable.
**Prevention:** Use a structured `referensi_dskp` table and store UUID references in the record.

## Moderate Pitfalls

### Pitfall 1: Brittle PDF Layout
**What goes wrong:** Relying purely on CSS for "print-ready" layouts without accounting for varying text lengths in activities/objectives.
**Prevention:** Test layouts with maximum expected text lengths and use `page-break-inside: avoid` in CSS.

## Minor Pitfalls

### Pitfall 1: Timezone Issues in Date Pickers
**What goes wrong:** Lesson dates (e.g., 2024-05-18) shifting by one day due to UTC conversion.
**Prevention:** Store dates as `YYYY-MM-DD` strings or ensure local timezone is accounted for during save/retrieval.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schema Update | Data loss during migration. | Backup database and use PostgreSQL `ALTER TABLE` carefully with default values. |
| PDF Export | Fonts not loading in PDF. | Embed fonts as base64 or ensure they are fully loaded before rendering the canvas. |
| Search | Slow queries on JSONB. | Add GIN indices to columns being searched via JSON path. |

## Sources

- [Supabase Performance Optimization](https://supabase.com/docs/guides/database/performance)
- [Postgres JSONB GIN Indexing](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING)
- [html2pdf-js Common Issues](https://github.com/eKoopmans/html2pdf.js/issues)
