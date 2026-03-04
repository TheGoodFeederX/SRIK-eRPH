---
phase: 02-ux-performance
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/RPHForm.tsx
autonomous: true
requirements:
  - REQ-07
must_haves:
  truths:
    - "DSKP fields (bidang, SK, SP, SPI) are filtered hierarchically in RPHForm"
    - "Selecting a subject and year triggers the fetch of available bidang"
    - "SPI/SP values are correctly handled as arrays within the form state"
    - "Dropdowns are disabled or empty if required parent selections are not made"
  artifacts:
    - path: "src/components/RPHForm.tsx"
      provides: "Hierarchical DSKP auto-lookup/filtering logic"
  key_links:
    - from: "src/components/RPHForm.tsx"
      to: "supabase/referensi_rph"
      via: "selective queries with multiple filters"
---

<objective>
Enhance the DSKP auto-lookup and hierarchical filtering logic in the RPHForm to ensure teachers can easily find and select the correct standards.
</objective>

<execution_context>
@/home/dietpi/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-2/RESEARCH.md
@src/components/RPHForm.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Optimize DSKP lookup queries in RPHForm</name>
  <files>src/components/RPHForm.tsx</files>
  <action>
    - Refine the existing `useEffect` hooks in `RPHForm.tsx` to handle hierarchical lookups more efficiently.
    - Fetch `bidang` based on `subjek` and `selectedYear`.
    - Fetch `SK` based on `subjek`, `selectedYear`, and `bidang`.
    - Fetch `SP` and `SPI` data based on `subjek`, `selectedYear`, `bidang`, and `tajukStandardKandungan`.
    - Ensure all selections are reset correctly when a parent field is changed.
  </action>
  <verify>
    <automated>grep -q ".eq('bidang', " src/components/RPHForm.tsx && grep -q ".eq('sk', " src/components/RPHForm.tsx</automated>
  </verify>
  <done>DSKP lookup uses full hierarchical filtering (Subjek -> Tahun -> Bidang -> SK).</done>
</task>

<task type="auto">
  <name>Task 2: Improve SP and SPI selection UX</name>
  <files>src/components/RPHForm.tsx</files>
  <action>
    - Ensure the multi-select UI for SP and SPI is intuitive.
    - Display standard descriptions clearly.
    - Implement a 'select all' or 'clear all' function for multi-selects.
    - Ensure the selected SP/SPI are correctly persisted to the `content` JSONB.
  </action>
  <verify>
    <automated>grep -q "multi-select-container" src/components/RPHForm.tsx</automated>
  </verify>
  <done>SP/SPI selection is user-friendly and data is correctly mapped to the record state.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Verify DSKP filtering and selection</name>
  <what-built>Enhanced DSKP auto-lookup and hierarchical filtering.</what-built>
  <how-to-verify>
    1. Select a subject and grade in the RPH form.
    2. Verify that the 'Bidang' dropdown is populated with relevant options.
    3. Select a Bidang and confirm that the 'SK' dropdown is filtered correctly.
    4. Select an SK and verify that the available SP and SPI are updated immediately.
    5. Change the subject and confirm that all child fields are reset and ready for a new selection.
  </how-to-verify>
  <resume-signal>approved</resume-signal>
</task>

</tasks>

<verification>
- All DSKP fields are filtered based on parent selections.
- Selection states reset correctly.
- SP and SPI multi-selection works as expected.
</verification>

<success_criteria>
- Teachers can find relevant DSKP standards with minimal effort.
- The form prevents invalid combinations of DSKP data.
</success_criteria>

<output>
After completion, create `.planning/phases/02-ux-performance/02-03-SUMMARY.md`
</output>
