---
phase: 01-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/01_initial_schema.sql
  - supabase/03_business_logic.sql
  - supabase/04_dskp_seed.sql
  - src/types/index.ts
autonomous: true
requirements:
  - REQ-01
  - REQ-02
must_haves:
  truths:
    - "referensi_rph table includes bidang, sp, and spi columns"
    - "rph_records table has content JSONB column instead of flat lesson fields"
    - "DSKP table contains hierarchical SK, SP, and SPI data"
    - "TypeScript RPHRecord interface matches the JSONB-based database structure and includes bidang"
  artifacts:
    - path: "supabase/01_initial_schema.sql"
      provides: "Updated schema for referensi_rph and RPH JSONB"
    - path: "supabase/04_dskp_seed.sql"
      provides: "Hierarchical DSKP seed data"
    - path: "src/types/index.ts"
      provides: "Aligned TypeScript interfaces including bidang"
  key_links:
    - from: "src/types/index.ts"
      to: "supabase/01_initial_schema.sql"
      via: "manual alignment of interface keys to JSONB keys"
---

<objective>
Refactor the database schema to support hierarchical DSKP data and a flexible JSONB 'content' column for RPH records, ensuring a stable foundation for the lesson planner.
</objective>

<execution_context>
@/home/dietpi/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-1/RESEARCH.md
@supabase/01_initial_schema.sql
@supabase/03_business_logic.sql
@src/types/index.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update referensi_rph schema</name>
  <files>supabase/01_initial_schema.sql</files>
  <action>
    Modify `public.referensi_rph` in `supabase/01_initial_schema.sql` to include columns for the full hierarchy:
    - Add `bidang` text (null allowed if some don't have it, but usually present)
    - Add `sp` text[] or jsonb (Standard Pembelajaran)
    - Add `spi` text[] or jsonb (Standard Prestasi)
    
    Given the current flat table, adding them as text/jsonb columns is necessary before seeding.
    Update the `create table` statement to:
    ```sql
    create table if not exists public.referensi_rph (
        id uuid primary key default uuid_generate_v4(),
        subjek text not null,
        tahun integer,
        bidang text,
        sk text not null,
        sp jsonb,
        spi jsonb,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );
    ```
  </action>
  <verify>
    <automated>grep -q "bidang text" supabase/01_initial_schema.sql && grep -q "sp jsonb" supabase/01_initial_schema.sql</automated>
  </verify>
  <done>referensi_rph schema updated to support the full DSKP hierarchy.</done>
</task>

<task type="auto">
  <name>Task 2: Seed hierarchical DSKP data</name>
  <files>supabase/04_dskp_seed.sql</files>
  <action>
    Create a new migration file to seed the `referensi_rph` table with full hierarchical data:
    - Standard Kandungan (SK)
    - Standard Pembelajaran (SP)
    - Standard Prestasi (SPI)
    - Bidang (e.g., Al-Quran, Aqidah, etc. for Pendidikan Islam)
    
    Ensure the seeding uses the new columns (`bidang`, `sp`, `spi`).
    Reference the current `referensi_rph` table structure but populate with richer, nested data as recommended in RESEARCH.md.
  </action>
  <verify>
    <automated>test -f supabase/04_dskp_seed.sql && grep -i "INSERT INTO" supabase/04_dskp_seed.sql</automated>
  </verify>
  <done>Database seeded with hierarchical DSKP data ready for lookup.</done>
</task>

<task type="auto">
  <name>Task 3: Refactor Supabase RPH table to use JSONB</name>
  <files>supabase/01_initial_schema.sql, supabase/03_business_logic.sql</files>
  <action>
    Modify `public.rph_records` in `supabase/01_initial_schema.sql`:
    - Remove flat columns: `tajuk_standard_kandungan`, `objektif`, `aktiviti`, `refleksi`.
    - Add `content` column of type `jsonb` (not null, default '{}').
    - Maintain metadata columns: `id`, `user_id`, `tarikh`, `hari`, `kelas`, `masa`, `subjek`, `created_at`.
    
    Update `supabase/03_business_logic.sql`:
    - Ensure any RPC functions or triggers referencing the removed columns are updated or removed.
  </action>
  <verify>
    <automated>grep -q "content jsonb" supabase/01_initial_schema.sql && ! grep -q "tajuk_standard_kandungan" supabase/01_initial_schema.sql</automated>
  </verify>
  <done>Database schema updated to use JSONB for core lesson data.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4: Update TypeScript RPHRecord interface</name>
  <files>src/types/index.ts</files>
  <behavior>
    - The `RPHRecord` interface should reflect the new JSONB structure.
    - Flexible lesson data should be nested within the `content` property.
    - Include `bidang` in the DSKP hierarchy within `content`.
  </behavior>
  <action>
    Update `RPHRecord` in `src/types/index.ts`:
    ```typescript
    export interface RPHRecord {
      id: string;
      user_id: string; 
      tarikh: string;
      hari: string;
      kelas: string;
      masa: string;
      subjek: string;
      content: {
        bidang?: string;
        tajukStandardKandungan?: string; // Often matches SK
        objektif?: string;
        aktiviti?: string;
        refleksi?: string;
        sp?: any[]; 
        spi?: any[];
      };
      created_at?: string;
    }
    ```
  </action>
  <verify>
    <automated>grep -q "bidang?" src/types/index.ts</automated>
  </verify>
  <done>TypeScript interfaces match the new JSONB database schema and hierarchy.</done>
</task>

</tasks>

<verification>
- referensi_rph table contains the new columns.
- RPH records use JSONB for content.
- TypeScript types reflect the change.
- Seed file contains DSKP data.
</verification>

<success_criteria>
- RPH records can represent complex activities and standards in a single JSONB column.
- Hierarchical DSKP data is available for the UI to consume.
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-01-SUMMARY.md`
</output>
