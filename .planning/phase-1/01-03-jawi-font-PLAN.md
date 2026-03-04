---
phase: 01-foundation
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/index.css
  - src/App.tsx
  - src/components/RPHForm.tsx
autonomous: true
requirements:
  - REQ-03
must_haves:
  truths:
    - "Noto Sans Arabic font is loaded and rendered correctly for Jawi/Arabic characters"
    - "Application uses a dedicated CSS class for Jawi typography"
  artifacts:
    - path: "package.json"
      provides: "fontsource font dependency"
    - path: "src/index.css"
      provides: "font face and utility classes"
  key_links:
    - from: "src/components/RPHForm.tsx"
      to: "src/index.css"
      via: "use of .font-jawi CSS class"
---

<objective>
Implement proper Jawi font rendering to support the specific typographic requirements of religious/Jawi subjects in the Malaysian curriculum.
</objective>

<execution_context>
@/home/dietpi/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-1/RESEARCH.md
@src/index.css
@src/App.tsx
@src/components/RPHForm.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Configure Noto Sans Arabic font</name>
  <files>package.json, src/index.css</files>
  <action>
    - Install `@fontsource/noto-sans-arabic` via npm/pnpm.
    - Import the font in `src/index.css`: `@import "@fontsource/noto-sans-arabic/400.css";` and `@import "@fontsource/noto-sans-arabic/700.css";`.
    - Create a global utility class `.font-jawi` that sets `font-family: 'Noto Sans Arabic', sans-serif;`.
  </action>
  <verify>
    <automated>grep -q "@fontsource/noto-sans-arabic" package.json && grep -q ".font-jawi" src/index.css</automated>
  </verify>
  <done>Noto Sans Arabic font is available for use in the application.</done>
</task>

<task type="auto">
  <name>Task 2: Apply Jawi font to UI components</name>
  <files>src/App.tsx, src/components/RPHForm.tsx</files>
  <action>
    - Add the `.font-jawi` class to the main `App` container or specific text areas in `RPHForm.tsx` where Jawi input is expected (e.g., Objektif, Aktiviti).
    - Ensure the font is applied to any display components that render Jawi characters.
  </action>
  <verify>
    <automated>grep -q "font-jawi" src/App.tsx || grep -q "font-jawi" src/components/RPHForm.tsx</automated>
  </verify>
  <done>UI elements correctly use the Jawi-compatible font for rendering Arabic characters.</done>
</task>

</tasks>

<verification>
- Verify font source package is installed.
- Check that Jawi/Arabic characters render using Noto Sans Arabic in the browser (visual inspection).
</verification>

<success_criteria>
- Jawi characters are legible and correctly styled throughout the application.
- The UI maintains professional typography for all subjects.
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-03-SUMMARY.md`
</output>
