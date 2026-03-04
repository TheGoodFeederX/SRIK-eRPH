---
phase: 03-jawi-pdf
plan: 03
type: execute
wave: 3
depends_on:
  - 03-02
files_modified:
  - src/lib/pdfGenerator.ts
  - src/components/RPHRecords.tsx
autonomous: true
requirements:
  - REQ-01
must_haves:
  truths:
    - "PDF output follows the official KSSR-standard layout"
    - "Bulk PDF generation is supported using the new pdfmake engine"
    - "Old html2canvas/jspdf code is removed or deprecated"
  artifacts:
    - path: "src/lib/pdfGenerator.ts"
      provides: "Finalized KSSR template"
  key_links:
    - from: "src/components/RPHRecords.tsx"
      to: "src/lib/pdfGenerator.ts"
      via: "integration of bulk and single export buttons"
---

<objective>
Finalize the PDF template to match KSSR standards and implement bulk export functionality for improved teacher productivity.
</objective>

<execution_context>
@/home/dietpi/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-3/RESEARCH.md
@src/lib/pdfGenerator.ts
@src/components/RPHRecords.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Design KSSR template in pdfmake</name>
  <files>src/lib/pdfGenerator.ts</files>
  <action>
    - Update the document definition in `generateRPH_PDF` to include:
        - Professional header with school logo (base64).
        - Tabular layout for metadata (Tarikh, Hari, Kelas, Masa).
        - Clearly defined sections for Bidang, SK, SP, SPI, Objektif, Aktiviti, and Refleksi.
        - Footer for teacher and principal signatures.
    - Ensure margins and font sizes are professional and compliant.
  </action>
  <verify>
    <automated>grep -q "table" src/lib/pdfGenerator.ts && grep -q "header" src/lib/pdfGenerator.ts</automated>
  </verify>
  <done>PDF template matches KSSR standards.</done>
</task>

<task type="auto">
  <name>Task 2: Implement bulk export</name>
  <files>src/lib/pdfGenerator.ts, src/components/RPHRecords.tsx</files>
  <action>
    - Implement `generateBulkRPH_PDF(records: RPHRecord[]): Promise<void>` in `src/lib/pdfGenerator.ts`.
    - This function should combine multiple records into a single PDF document, with each RPH starting on a new page.
    - Update `RPHRecords.tsx` to call these new functions instead of the old bulk PDF logic.
  </action>
  <verify>
    <automated>grep -q "generateBulkRPH_PDF" src/components/RPHRecords.tsx</automated>
  </verify>
  <done>Bulk export functionality is updated to use the new high-quality engine.</done>
</task>

<task type="auto">
  <name>Task 3: Cleanup legacy code</name>
  <files>src/components/RPHRecords.tsx, src/components/PrintPreview.tsx</files>
  <action>
    - Remove or comment out unused `html2canvas`, `jspdf`, and `html2pdf.js` related code from `RPHRecords.tsx` and other components.
    - Ensure `PrintPreview.tsx` (if it has its own PDF logic) is also updated or integrated with the new engine.
  </action>
  <verify>
    <automated>! grep -q "html2canvas" src/components/RPHRecords.tsx</automated>
  </verify>
  <done>Legacy PDF generation code is removed.</done>
</task>

</tasks>

<verification>
- Single PDF export results in a professional KSSR-standard layout.
- Bulk PDF export combines multiple selected records correctly.
- Application performance remains stable during bulk generation.
</verification>

<success_criteria>
- The final PDF output is indistinguishable from official physical RPH records.
- The export process is fast and reliable.
</success_criteria>

<output>
After completion, create `.planning/phases/03-jawi-pdf/03-SUMMARY.md`
</output>
