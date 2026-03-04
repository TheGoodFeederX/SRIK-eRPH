---
phase: 03-jawi-pdf
plan: 02
type: execute
wave: 2
depends_on:
  - 03-01
files_modified:
  - package.json
  - src/lib/pdfGenerator.ts
  - src/components/RPHRecords.tsx
autonomous: false
requirements:
  - REQ-03
must_haves:
  truths:
    - "pdfmake is installed and configured"
    - "Noto Sans Arabic font is embedded in the PDF generation process"
    - "pdfGenerator.ts provides a function to generate RPH PDFs using processed Jawi text"
  artifacts:
    - path: "src/lib/pdfGenerator.ts"
      provides: "New PDF generation engine"
  key_links:
    - from: "src/lib/pdfGenerator.ts"
      to: "src/lib/jawiUtils.ts"
      via: "import for Jawi processing"
---

<objective>
Migrate from html2canvas/jspdf to pdfmake to enable high-quality PDF generation with proper font embedding and RTL support.
</objective>

<execution_context>
@/home/dietpi/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-3/RESEARCH.md
@src/lib/jawiUtils.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install pdfmake and setup fonts</name>
  <files>package.json, src/lib/pdfGenerator.ts</files>
  <action>
    - Install `pdfmake` via pnpm.
    - Setup `vfs_fonts` or a mechanism to load `Noto Sans Arabic` into `pdfmake`.
    - Create `src/lib/pdfGenerator.ts` with basic configuration for `pdfmake`.
  </action>
  <verify>
    <automated>grep -q "pdfmake" package.json && test -f src/lib/pdfGenerator.ts</automated>
  </verify>
  <done>pdfmake is installed and configured with the required Jawi-compatible font.</done>
</task>

<task type="auto">
  <name>Task 2: Implement core PDF generation logic</name>
  <files>src/lib/pdfGenerator.ts</files>
  <action>
    - Implement `generateRPH_PDF(record: RPHRecord): Promise<void>` in `src/lib/pdfGenerator.ts`.
    - Ensure all Jawi fields (Objective, Activity, etc.) are passed through `processJawi` from `jawiUtils.ts`.
    - Define a basic document definition for `pdfmake` that includes the header and record metadata.
  </action>
  <verify>
    <automated>grep -q "processJawi" src/lib/pdfGenerator.ts</automated>
  </verify>
  <done>Core PDF generation with Jawi support is implemented.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Verify PDF font rendering</name>
  <what-built>A basic PDF generated via pdfmake with Jawi text.</what-built>
  <how-to-verify>
    1. Trigger a PDF generation for a record containing Jawi text.
    2. Open the resulting PDF.
    3. Verify that Jawi characters are rendered correctly using Noto Sans Arabic and are NOT disconnected.
  </how-to-verify>
  <resume-signal>approved</resume-signal>
</task>

</tasks>

<verification>
- PDF renders Jawi text with correct ligatures.
- Noto Sans Arabic font is visibly used in the PDF.
</verification>

<success_criteria>
- High-quality, vector-based PDF output (not rasterized canvas).
- Perfect Jawi rendering regardless of browser environment.
</success_criteria>

<output>
After completion, create `.planning/phases/03-jawi-pdf/02-SUMMARY.md`
</output>
