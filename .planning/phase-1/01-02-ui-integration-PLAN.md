---
phase: 01-foundation
plan: 02
type: execute
wave: 2
depends_on:
  - 01-01
files_modified:
  - src/components/RPHForm.tsx
  - src/hooks/useRecords.ts
autonomous: false
requirements:
  - REQ-01
  - REQ-04
must_haves:
  truths:
    - "RPH creation form includes selection components for bidang, SK, SP, and SPI"
    - "RPH creation form correctly saves nested lesson data to the JSONB content field"
    - "Errors during Supabase persistence are displayed to the user via toast/alert"
  artifacts:
    - path: "src/components/RPHForm.tsx"
      provides: "Updated form UI with DSKP hierarchy and error logic"
    - path: "src/hooks/useRecords.ts"
      provides: "Robust error handling in data fetching/saving"
  key_links:
    - from: "src/components/RPHForm.tsx"
      to: "src/hooks/useRecords.ts"
      via: "function calls with nested JSONB structure"
---

<objective>
Update the RPH creation/edit form to support the full DSKP hierarchy and the new JSONB schema, while implementing robust user-facing error handling.
</objective>

<execution_context>
@/home/dietpi/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/types/index.ts (updated in 01-01)
@src/components/RPHForm.tsx
@src/hooks/useRecords.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement DSKP hierarchy selection in RPHForm</name>
  <files>src/components/RPHForm.tsx</files>
  <action>
    - Add UI components (Select/Multi-select) to `RPHForm.tsx` for:
        - Bidang (Standard Selection)
        - Standard Kandungan (SK) - Current `tajukStandardKandungan`
        - Standard Pembelajaran (SP) - Multi-selection
        - Standard Prestasi (SPI) - Multi-selection
    - Fetch hierarchical data from `referensi_rph` based on selected `subjek` and `tahun`.
    - Implement cascading logic: selecting `subjek` -> filters `bidang` -> filters `SK` -> filters `SP/SPI`.
  </action>
  <verify>
    <automated>grep -q "bidang" src/components/RPHForm.tsx && grep -q "sp" src/components/RPHForm.tsx</automated>
  </verify>
  <done>UI supports selecting full DSKP hierarchy.</done>
</task>

<task type="auto">
  <name>Task 2: Update RPHForm saving logic for JSONB</name>
  <files>src/components/RPHForm.tsx</files>
  <action>
    - Update the `handleSubmit` and form data management in `RPHForm.tsx` to align with the new `RPHRecord` interface.
    - Map `bidang`, `tajukStandardKandungan`, `objektif`, `aktiviti`, `refleksi`, `sp`, and `spi` fields into the `content` property of the record being submitted.
    - Ensure existing records (initialData) correctly populate the form from their `content` object.
  </action>
  <verify>
    <automated>grep -q "content:" src/components/RPHForm.tsx</automated>
  </verify>
  <done>Form data is correctly structured as JSONB before submission, including hierarchy.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Implement robust error handling in RPHForm</name>
  <files>src/components/RPHForm.tsx, src/hooks/useRecords.ts</files>
  <behavior>
    - Any Supabase save/update failure should be caught.
    - The user should receive a clear, visual notification when a save fails.
    - The form should not reset or clear data if the save operation fails.
  </behavior>
  <action>
    - Wrap the save operation in a try/catch block.
    - Add a state for tracking error messages in the form.
    - Display the error message in the UI.
  </action>
  <verify>
    <automated>grep -q "try {" src/components/RPHForm.tsx && grep -q "catch" src/components/RPHForm.tsx</automated>
  </verify>
  <done>Saving errors are handled gracefully and communicated to the user.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Verify form persistence and error handling</name>
  <what-built>RPH form with DSKP hierarchy selection, JSONB persistence and error handling.</ what-built>
  <how-to-verify>
    1. Select a subject and grade.
    2. Verify you can select Bidang, SK, and multiple SP/SPI.
    3. Fill remaining fields and save.
    4. Confirm it saves successfully and appears in the list.
    5. Simulate a failure and confirm error message display.
  </how-to-verify>
  <resume-signal>approved</resume-signal>
</task>

</tasks>

<verification>
- Data is correctly nested in the 'content' object during save operations.
- DSKP hierarchy is selectable in the UI.
- Error states are triggered and displayed correctly.
</verification>

<success_criteria>
- Users can select the full DSKP hierarchy in the form.
- The UI handles the new database structure seamlessly with proper error feedback.
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-02-SUMMARY.md`
</output>
