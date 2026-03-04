# Phase 1: Foundation & Data Integrity - Research

**Researched:** 2024-05-24
**Domain:** Supabase Schema, React Data Flow, Jawi Typography
**Confidence:** HIGH

## Summary

This phase focuses on stabilizing the core data architecture and ensuring the system handles the unique requirements of Malaysian educational records (e.g., Jawi support, complex DSKP hierarchy). The primary technical shift is moving from a flat schema to a **hybrid relational-JSONB schema** in Supabase, allowing for flexible lesson activities and nested Standard Pembelajaran (SP) / Standard Prestasi (SPI) data without constant migrations.

**Primary recommendation:** Use a `jsonb` column named `content` in `rph_records` for all non-relational lesson data (activities, objectives, standards), while keeping metadata (date, subject, user_id) as fixed columns for efficient filtering. Implement `@fontsource/noto-sans-arabic` for robust Jawi support.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-01 | DSKP-Based RPH Generation | Research on DSKP hierarchy (SK -> SP -> SPI) and nested JSONB storage. |
| REQ-02 | Data Persistence (Supabase) | Research on hybrid schema patterns and GIN indexing for JSONB performance. |
| REQ-03 | Jawi Character Support | Research on Jawi-compatible fonts (Noto Sans Arabic) and Vite bundling via `@fontsource`. |
| REQ-04 | Robust Error Handling | Research on Supabase PostgREST error patterns and React UI feedback. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.x | Backend-as-a-Service | Native integration with Postgres JSONB and Auth. |
| `@fontsource/noto-sans-arabic` | Latest | Typography | Best OpenType shaping for Jawi characters (Nya, Ga, Pa, etc.). |
| `framer-motion` | ^10.x | UI Animations | Provided in project for smooth transitions (already in use). |
| `lucide-react` | Latest | Iconography | Lightweight and consistent icons. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | ^3.x | Validation | Validating nested JSONB structures before saving to Supabase. |
| `react-hot-toast` | Latest | Feedback | (Recommended) For displaying Supabase errors to users. |

## Architecture Patterns

### Recommended Project Structure
```
supabase/
├── migrations/
│   └── 20240524000000_refactor_rph_jsonb.sql
src/
├── components/
│   ├── ui/
│   │   └── ErrorMessage.tsx    # Standardized error display
│   └── RPH/
│       ├── ActivityEditor.tsx  # Specialized component for JSONB activities
│       └── DSKPSelector.tsx   # Hierarchical selector (SK -> SP)
```

### Pattern 1: Hybrid Relational-JSONB Schema
**What:** Keep "searchable/filterable" data in standard columns and "fluid" data in a JSONB blob.
**When to use:** For Malaysian e-RPH where KPM updates secondary fields (EMK, KBAT, Nilai) frequently.
**Example:**
```sql
ALTER TABLE rph_records 
ADD COLUMN content JSONB DEFAULT '{
  "objectives": [],
  "activities": [
    {"step": "Set Induksi", "desc": ""},
    {"step": "Langkah 1", "desc": ""},
    {"step": "Penutup", "desc": ""}
  ],
  "standards": {
    "sp": [],
    "spi": []
  }
}'::jsonb;
```

### Pattern 2: Supabase Error Handling Wrapper
**What:** Standardize how results from Supabase are handled to ensure errors are never "swallowed."
**Example:**
```typescript
const { data, error } = await supabase
  .from('rph_records')
  .insert(record);

if (error) {
  // Handle specifically known codes
  if (error.code === '42501') throw new Error('Permission denied. Please log in again.');
  throw new Error(error.message);
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Jawi Font Management | Manual @font-face | `@fontsource` | Handles subsetting, compression (Woff2), and versioning. |
| JSON Schema Validation | Manual JS checks | `Zod` or `pg_jsonschema` | JSONB is schemaless; needs strict validation to prevent UI crashes. |
| Date Formatting | String manipulation | `date-fns` or native `Intl` | Handles locale-specific Malay days/months correctly. |

## Common Pitfalls

### Pitfall 1: JSONB Query Syntax
**What goes wrong:** Using `->` (JSON object) instead of `->>` (Text) when comparing strings in filters.
**Prevention:** Use `->>` for equality checks and `->` only for nesting or JSON operations.

### Pitfall 2: Jawi Ligatures & Shaping
**What goes wrong:** Jawi characters (like 'Pa' or 'Ga') appearing as detached blocks.
**Prevention:** Use **Noto Sans Arabic** or **Amiri**. Avoid system fonts like 'Arial' or 'Times New Roman' which lack Jawi-specific OpenType tables.

### Pitfall 3: RLS Blindness
**What goes wrong:** Queries returning empty arrays `[]` instead of errors when RLS policies are missing or incorrect.
**Prevention:** Always test with `supabase.auth.getSession()` to ensure the user is context-aware during development.

## Code Examples

### JSONB Update Pattern
```typescript
// Source: https://supabase.com/docs/guides/database/json
const updateActivity = async (id: string, newActivities: any[]) => {
  const { data, error } = await supabase
    .from('rph_records')
    .update({ 
      content: { 
        ...currentContent, // Requires fetching current or using jsonb_set in SQL
        activities: newActivities 
      } 
    })
    .eq('id', id);
};
```

### Jawi Support with RTL
```tsx
const JawiText = ({ children }: { children: string }) => (
  <div 
    dir="rtl" 
    lang="ms-Arab" 
    style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}
    className="text-right"
  >
    {children}
  </div>
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat SQL Columns | Hybrid JSONB | 2023+ | Faster iteration for KPM form changes. |
| Google Fonts Link | `@fontsource` | Vite era | Zero Layout Shift (CLS) and better offline support. |
| manual `try/catch` | `if(error)` checks | Supabase v2 | More predictable result objects. |

## Open Questions

1. **DSKP Full Data Source:**
   - What we know: Current `referensi_rph` is incomplete (missing SP/SPI).
   - What's unclear: Is there a complete JSON/CSV dump of the latest DSKP available?
   - Recommendation: Plan a "Wave 0" task to seed the DSKP table with full hierarchical data.

2. **Jawi Reshaping:**
   - What we know: `arabic-persian-reshaper` is mentioned in requirements.
   - What's unclear: Is it needed if we use modern fonts like Noto Sans Arabic? (Usually modern browsers handle shaping if fonts are correct).
   - Recommendation: Test without reshaper first; only add if legacy browsers must be supported.

## Sources

### Primary (HIGH confidence)
- Supabase Docs - [JSONB Guides](https://supabase.com/docs/guides/database/json)
- Google Fonts - [Noto Sans Arabic Specification](https://fonts.google.com/specimen/Noto+Sans+Arabic)
- Fontsource - [Amiri/Noto Bundling](https://fontsource.org/)

### Secondary (MEDIUM confidence)
- KPM SPI Bil. 3/1999 - (General RPH format requirements)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Industry standard for React/Supabase.
- Architecture: HIGH - Proven hybrid schema pattern.
- Pitfalls: MEDIUM - Based on common community issues.

**Research date:** 2024-05-24
**Valid until:** 2024-06-24
