# Architecture Patterns: eRPH

**Domain:** Educational Record Management (eRPH)
**Researched:** 2025-05-18

## Recommended Architecture

A hybrid model combining **Relational Core** (Postgres) and **Semi-Structured Document** (JSONB) storage.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `referensi_dskp` | Single source of truth for all curriculum standards. | `RPHForm`, `RPHRecords` |
| `rph_records` | Stores historical teaching logs. | `profiles`, `referensi_dskp` |
| `RPHForm` | Handles complex multi-part lesson planning. | Supabase Client (RPC & Tables) |

### Data Flow

1. Teacher selects **Subject/Year**.
2. `RPHForm` queries `referensi_dskp` for relevant **SK** (Standard Kandungan) and **SP** (Standard Pembelajaran).
3. Teacher selects SK/SP and types in objectives/activities.
4. On save: Core lesson metadata is saved to columns; objectives/activities/mappings are saved to a **JSONB** column.
5. **Snapshot**: A copy of the SK/SP text is saved into the record to ensure historical accuracy if the master DSKP database is updated later.

## Patterns to Follow

### Pattern 1: JSONB Snapshotting
**What:** Store both the foreign key AND the text value of a reference in the record.
**When:** For official records (eRPH) that must remain unchanged even if the master curriculum data is updated.
**Example:**
```json
{
  "sk_id": "uuid-123",
  "sk_text": "1.1 Kemahiran Membaca"
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side "Select All"
**What:** Fetching every record for a user and filtering in the UI.
**Why bad:** Destroys performance and data usage for long-term users.
**Instead:** Use Supabase `.range()` for pagination and `.ilike()` for server-side search.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Record Fetching | No issue. | Must use pagination. | Dedicated search engine (Typesense/Elastic). |
| DSKP Queries | Simple `SELECT`. | Cache frequently used DSKP. | Global CDN caching. |
| PDF Gen | Client-side. | Client-side (mostly). | Background worker (Edge Functions). |

## Sources

- [Supabase JSONB Guide](https://supabase.com/docs/guides/database/json)
- [Historical Snapshotting Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
