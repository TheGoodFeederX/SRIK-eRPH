---
phase: 03-jawi-pdf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/lib/jawiUtils.ts
autonomous: true
requirements:
  - REQ-03
must_haves:
  truths:
    - "arabic-reshaper and bidi-js are installed as dependencies"
    - "jawiUtils.ts exports a function to reshape and reorder Jawi text"
    - "Utility correctly handles Malaysian Jawi characters (if any unique ones exist beyond standard Arabic)"
  artifacts:
    - path: "src/lib/jawiUtils.ts"
      provides: "Text processing logic for Jawi ligatures"
  key_links:
    - from: "src/lib/jawiUtils.ts"
      to: "arabic-reshaper"
      via: "import"
---

<objective>
Implement the Jawi processing logic required for correct ligature rendering in environments that do not support native Arabic reshaping (like PDF engines).
</objective>

<execution_context>
@/home/dietpi/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-3/RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Jawi processing dependencies</name>
  <files>package.json</files>
  <action>
    - Install `arabic-reshaper` and `bidi-js` via pnpm.
    - Also install `@types/arabic-reshaper` if available, or create a declaration file if needed.
  </action>
  <verify>
    <automated>grep -q "arabic-reshaper" package.json && grep -q "bidi-js" package.json</automated>
  </verify>
  <done>Dependencies for Jawi processing are available.</done>
</task>

<task type="auto">
  <name>Task 2: Create Jawi utility</name>
  <files>src/lib/jawiUtils.ts</files>
  <action>
    - Implement `processJawi(text: string): string` in `src/lib/jawiUtils.ts`.
    - Use `arabic-reshaper` to convert Unicode characters to their contextual forms.
    - Use `bidi-js` to handle the RTL reordering.
    - Add a test string or log to verify ligatures (e.g., "سلام" should be reshaped).
  </action>
  <verify>
    <automated>test -f src/lib/jawiUtils.ts && grep -q "reshape" src/lib/jawiUtils.ts</automated>
  </verify>
  <done>Jawi processing utility is implemented and verified.</done>
</task>

</tasks>

<verification>
- Verify that Jawi text passed through the utility results in correct contextual forms (visual inspection of logs/tests).
</verification>

<success_criteria>
- Jawi characters are correctly joined into ligatures after processing.
- The utility handles bidirectional text (Jawi mixed with Latin) correctly.
</success_criteria>

<output>
After completion, create `.planning/phases/03-jawi-pdf/01-SUMMARY.md`
</output>
